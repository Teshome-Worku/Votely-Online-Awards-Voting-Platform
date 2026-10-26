import { redirect } from "next/navigation";
import { getCurrentUser, type SafeUser } from "@/lib/auth";

/**
 * Server guard: Enforces that the request has an authenticated session.
 * Used in Server Components and Route Handlers.
 */
export async function requireAuth(redirectTo: string = "/login"): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Server guard: Enforces that the user is an authenticated ORGANIZER.
 * Redirects unauthenticated users to /login?next=/dashboard.
 * Redirects PLATFORM_ADMIN users to /admin to enforce role separation.
 */
export async function requireOrganizer(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }

  // Prevent PLATFORM_ADMIN from entering organizer dashboard
  if (user.role === "PLATFORM_ADMIN") {
    redirect("/admin");
  }

  if (user.role !== "ORGANIZER") {
    redirect("/login");
  }

  return user;
}

/**
 * Server guard: Enforces that the user is a PLATFORM_ADMIN.
 * Redirects unauthenticated users to /login?next=/admin.
 * Redirects non-admin ORGANIZER users to /dashboard to enforce role separation.
 */
export async function requirePlatformAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "PLATFORM_ADMIN") {
    redirect("/dashboard");
  }

  return user;
}
