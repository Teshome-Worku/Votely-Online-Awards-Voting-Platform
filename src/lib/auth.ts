import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Session, Role, AccountStatus } from "@prisma/client";

export const SESSION_COOKIE_NAME = "votely_session";
export const SESSION_DURATION_DAYS = 7;
const BCRYPT_ROUNDS = 12;

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  organization: string | null;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Normalizes email address by trimming whitespace and converting to lowercase.
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generates a high-entropy cryptographically secure session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Creates a new session in the database.
 */
export async function createSession(
  userId: string,
  metadata?: { userAgent?: string; ipAddress?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
      userAgent: metadata?.userAgent,
      ipAddress: metadata?.ipAddress,
    },
  });

  return { token, expiresAt };
}

/**
 * Validates a session token.
 * If expired or user inactive, removes invalid session and returns null.
 */
export async function validateSessionToken(
  token: string
): Promise<{ session: Session; user: SafeUser } | null> {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }

  // Check account status
  if (session.user.status !== "ACTIVE") {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = session.user;
  return { session, user: safeUser };
}

/**
 * Invalidates a specific session token upon logout.
 */
export async function invalidateSession(token: string): Promise<void> {
  if (!token) return;
  await prisma.session.delete({ where: { token } }).catch(() => {});
}

/**
 * Invalidates all active sessions for a user (e.g. security reset).
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

let testUserOverride: SafeUser | null = null;

/**
 * Sets an in-memory authenticated user for integration testing.
 */
export function setTestUser(user: SafeUser | null) {
  testUserOverride = user;
}

/**
 * Retrieves the currently authenticated user in Next.js Server Components / Actions.
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  if (testUserOverride) {
    return testUserOverride;
  }

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    const result = await validateSessionToken(sessionCookie.value);
    return result ? result.user : null;
  } catch {
    return null;
  }
}

/**
 * Registration input validation rules.
 */
export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  organization?: string;
  phoneNumber?: string;
  role?: unknown; // Explicitly checked to prevent privilege escalation
}

export function validateRegistrationInput(input: Partial<RegistrationInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters long.";
  }

  const email = normalizeEmail(input.email || "");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = "Please provide a valid email address.";
  }

  if (!input.password || input.password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[A-Za-z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    errors.password = "Password must contain both letters and numbers.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Registers a new organizer account.
 * Note: Regardless of input, role is STRICTLY hardcoded to ORGANIZER.
 */
export async function registerOrganizer(input: RegistrationInput): Promise<{
  success: boolean;
  user?: SafeUser;
  error?: string;
  fieldErrors?: Record<string, string>;
}> {
  const validation = validateRegistrationInput(input);
  if (!validation.isValid) {
    return { success: false, fieldErrors: validation.errors };
  }

  const normalizedEmail = normalizeEmail(input.email);

  // Check duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return {
      success: false,
      error: "An account with this email address already exists.",
    };
  }

  const passwordHash = await hashPassword(input.password);

  // Strictly enforce Role.ORGANIZER - never trust input for role assignment
  const newUser = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "ORGANIZER",
      status: "ACTIVE",
      organization: input.organization ? input.organization.trim() : null,
      phoneNumber: input.phoneNumber ? input.phoneNumber.trim() : null,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}
