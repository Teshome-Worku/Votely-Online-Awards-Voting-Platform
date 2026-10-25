"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  normalizeEmail,
  verifyPassword,
  createSession,
  invalidateSession,
  registerOrganizer,
  validateRegistrationInput,
  SESSION_COOKIE_NAME,
  getCurrentUser,
  SafeUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  redirectUrl?: string;
}

/**
 * Helper to get client IP for rate limiting
 */
async function getClientIp(): Promise<string> {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Helper to get User Agent
 */
async function getUserAgent(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get("user-agent") || "unknown";
}

/**
 * Server action: Register a new Organizer
 */
export async function registerAction(
  formData: FormData
): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const rateLimitKey = `register:${ip}`;
  const rateLimit = checkRateLimit(rateLimitKey, 10, 60 * 60 * 1000); // 10 attempts per hour

  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many registration attempts. Please try again later.",
    };
  }

  const name = formData.get("name")?.toString() || "";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const organization = formData.get("organization")?.toString();
  const phoneNumber = formData.get("phoneNumber")?.toString();

  // Validate inputs
  const validation = validateRegistrationInput({ name, email, password });
  if (!validation.isValid) {
    return {
      success: false,
      fieldErrors: validation.errors,
    };
  }

  // Attempt registration (strictly sets ORGANIZER role)
  const result = await registerOrganizer({
    name,
    email,
    password,
    organization,
    phoneNumber,
  });

  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || "Registration failed. Please check your inputs.",
      fieldErrors: result.fieldErrors,
    };
  }

  // Automatically create authenticated session after registration
  const userAgent = await getUserAgent();
  const { token, expiresAt } = await createSession(result.user.id, {
    userAgent,
    ipAddress: ip,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return {
    success: true,
    redirectUrl: "/dashboard",
  };
}

/**
 * Server action: Login
 */
export async function loginAction(
  formData: FormData
): Promise<AuthActionResult> {
  const ip = await getClientIp();
  const rawEmail = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const normalizedEmail = normalizeEmail(rawEmail);

  if (!normalizedEmail || !password) {
    return {
      success: false,
      error: "Please provide both email address and password.",
    };
  }

  const rateLimitKey = `login:${ip}:${normalizedEmail}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes

  if (!rateLimit.success) {
    return {
      success: false,
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    return {
      success: false,
      error: "Invalid email address or password.",
    };
  }

  if (user.status !== "ACTIVE") {
    return {
      success: false,
      error: "This account has been suspended or is not active. Please contact support.",
    };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return {
      success: false,
      error: "Invalid email address or password.",
    };
  }

  // Clear failed rate limit count upon success
  resetRateLimit(rateLimitKey);

  // Establish session
  const userAgent = await getUserAgent();
  const { token, expiresAt } = await createSession(user.id, {
    userAgent,
    ipAddress: ip,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  const redirectUrl = user.role === "PLATFORM_ADMIN" ? "/admin" : "/dashboard";

  return {
    success: true,
    redirectUrl,
  };
}

/**
 * Server action: Logout
 */
export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await invalidateSession(token);
      cookieStore.delete(SESSION_COOKIE_NAME);
    }
  } catch {
    // Session cleanup error should not block redirection
  }

  redirect("/login");
}

/**
 * Server action: Get current user
 */
export async function getCurrentUserAction(): Promise<SafeUser | null> {
  return getCurrentUser();
}
