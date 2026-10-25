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
 * Server guard: Enforces that the user is an ORGANIZER or PLATFORM_ADMIN.
 * Redirects unauthenticated users to /login.
 */
export async function requireOrganizer(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/dashboard");
  }
  return user;
}

/**
 * Server guard: Enforces that the user is a PLATFORM_ADMIN.
 * Redirects unauthenticated users to /login, and non-admin users to 403 Forbidden.
 */
export async function requirePlatformAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }

  if (user.role !== "PLATFORM_ADMIN") {
    // Return forbidden response or redirect to access-denied
    redirect("/access-denied");
  }

  return user;
}
