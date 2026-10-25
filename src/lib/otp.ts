import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber, hashPhoneNumber, maskPhoneNumber } from "@/lib/phone";
import { getSmsProvider } from "@/lib/sms";
import { checkRateLimit } from "@/lib/rate-limit";

export const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
export const VOTER_SESSION_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_VERIFY_ATTEMPTS = 3;

/**
 * Generates a high-entropy 6-digit numeric OTP.
 */
export function generateNumericOtp(): string {
  // Uses crypto.randomInt for cryptographically secure random integer
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP code with secret salt for secure database storage.
 */
export function hashOtpCode(otp: string): string {
  const secret = process.env.SESSION_SECRET || "votely-otp-secret-salt-32-chars-long";
  return crypto.createHmac("sha256", secret).update(otp.trim()).digest("hex");
}

/**
 * Constant-time comparison of OTP hashes.
 */
export function verifyOtpCode(inputOtp: string, expectedHash: string): boolean {
  const inputHash = hashOtpCode(inputOtp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(inputHash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Requests and dispatches an OTP challenge to a voter's phone number.
 */
export async function requestOtp(
  eventId: string,
  rawPhone: string
): Promise<{
  success: boolean;
  challengeId?: string;
  maskedPhone?: string;
  error?: string;
}> {
  // Normalize phone number
  const norm = normalizePhoneNumber(rawPhone);
  if (!norm.isValid || !norm.e164) {
    return { success: false, error: norm.error || "Invalid phone number." };
  }

  const phone = norm.e164;

  // Rate limit: max 3 requests per 15 minutes per phone
  const rateLimitKey = `otp_request:${phone}`;
  const rateLimit = checkRateLimit(rateLimitKey, 3, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many verification requests. Please wait 15 minutes before requesting another code.",
    };
  }

  // Generate OTP and secure hash
  const otp = generateNumericOtp();
  const otpHash = hashOtpCode(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

  // Store challenge in database
  const challenge = await prisma.otpChallenge.create({
    data: {
      eventId,
      phoneNumber: phone,
      otpHash,
      expiresAt,
    },
  });

  // Dispatch via SMS provider
  const smsProvider = getSmsProvider();
  const sendResult = await smsProvider.sendOtp(phone, otp);

  if (!sendResult.success) {
    // If provider fails, clean up challenge and return clear error
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
    return {
      success: false,
      error: sendResult.error || "SMS provider failed to deliver verification code. Please try again later.",
    };
  }

  return {
    success: true,
    challengeId: challenge.id,
    maskedPhone: maskPhoneNumber(phone),
  };
}

/**
 * Verifies a submitted OTP challenge and establishes a voter session.
 */
export async function verifyOtp(
  challengeId: string,
  inputOtp: string
): Promise<{
  success: boolean;
  voterSessionToken?: string;
  phoneHash?: string;
  maskedPhone?: string;
  error?: string;
}> {
  const cleanedOtp = (inputOtp || "").trim();
  if (!cleanedOtp || cleanedOtp.length !== 6 || !/^\d{6}$/.test(cleanedOtp)) {
    return { success: false, error: "Please enter a valid 6-digit verification code." };
  }

  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return { success: false, error: "Verification challenge not found or expired." };
  }

  // Single-use check: must not be already verified
  if (challenge.verifiedAt) {
    return { success: false, error: "This verification code has already been used." };
  }

  // Expiration check
  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.otpChallenge.delete({ where: { id: challengeId } }).catch(() => {});
    return { success: false, error: "Verification code has expired. Please request a new code." };
  }

  // Attempt limit check
  if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
    await prisma.otpChallenge.delete({ where: { id: challengeId } }).catch(() => {});
    return {
      success: false,
      error: "Too many incorrect attempts. This code has been invalidated. Please request a new code.",
    };
  }

  // Check OTP
  const isMatch = verifyOtpCode(cleanedOtp, challenge.otpHash);
  if (!isMatch) {
    await prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } },
    });
    return { success: false, error: "Incorrect verification code. Please try again." };
  }

  // Mark challenge as verified (single-use)
  await prisma.otpChallenge.update({
    where: { id: challengeId },
    data: { verifiedAt: new Date() },
  });

  // Create VoterSession token (valid for 30 minutes)
  const voterToken = crypto.randomBytes(32).toString("hex");
  const phoneHash = hashPhoneNumber(challenge.phoneNumber);
  const sessionExpiresAt = new Date(Date.now() + VOTER_SESSION_EXPIRATION_MS);

  await prisma.voterSession.create({
    data: {
      token: voterToken,
      eventId: challenge.eventId,
      phoneNumber: challenge.phoneNumber,
      phoneHash,
      expiresAt: sessionExpiresAt,
    },
  });

  return {
    success: true,
    voterSessionToken: voterToken,
    phoneHash,
    maskedPhone: maskPhoneNumber(challenge.phoneNumber),
  };
}

/**
 * Validates a voter session token.
 */
export async function validateVoterSession(
  token: string,
  eventId: string
): Promise<{
  isValid: boolean;
  phoneHash?: string;
  phoneNumber?: string;
  error?: string;
}> {
  if (!token) {
    return { isValid: false, error: "Missing voter verification session." };
  }

  const session = await prisma.voterSession.findUnique({
    where: { token },
  });

  if (!session) {
    return { isValid: false, error: "Voter session not found or expired. Please verify your phone number." };
  }

  if (session.eventId !== eventId) {
    return { isValid: false, error: "Voter session does not match the current event." };
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.voterSession.delete({ where: { token } }).catch(() => {});
    return { isValid: false, error: "Voting session has expired. Please verify your phone number again." };
  }

  return {
    isValid: true,
    phoneHash: session.phoneHash,
    phoneNumber: session.phoneNumber,
  };
}
