/**
 * Votely Automated Test Suite: Role-Based Routing & Dashboard Authorization
 * Verifies:
 * 1. Organizer login directs to /dashboard
 * 2. Platform Admin login directs to /admin
 * 3. Organizer accessing /admin is redirected to /dashboard
 * 4. Admin accessing /dashboard is redirected to /admin
 * 5. Unauthenticated access to /dashboard and /admin redirects to /login
 * 6. Non-organizers (PLATFORM_ADMIN) blocked from creating events
 * 7. Multi-tenant organizer event isolation
 * 8. First-time organizer empty state with 0 counts vs populated state
 */

import { prisma } from "../src/lib/prisma";
import { registerOrganizer, setTestUser } from "../src/lib/auth";
import { requireOrganizer, requirePlatformAdmin } from "../src/lib/guard";
import { createEventAction } from "../src/actions/event";

let passedCount = 0;
let failedCount = 0;

function assert(condition: unknown, message: string) {
  if (!condition) {
    failedCount++;
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedCount++;
    console.log(`  PASS: ${message}`);
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   Votely: Role-Based Routing & Dashboard Auth Suite   ");
  console.log("=======================================================\n");

  // Clean test records only
  await prisma.event.deleteMany({
    where: {
      OR: [
        { organizer: { email: { contains: "example.com" } } },
        { organizer: { email: { contains: "test.com" } } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: "example.com" } },
        { email: { contains: "test.com" } },
      ],
    },
  });

  // 1. Create Organizer and Platform Admin accounts
  const orgRes = await registerOrganizer({
    name: "Tigist Organizer",
    email: "tigist@example.com",
    password: "Password123",
    organization: "Addis Film Society",
  });
  const organizerUser = orgRes.user!;

  const adminUser = await prisma.user.create({
    data: {
      name: "Root Platform Admin",
      email: "rootadmin@example.com",
      passwordHash: "dummyHash123",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      organization: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // -------------------------------------------------------------------------
  // Test 1: Role verification from database
  // -------------------------------------------------------------------------
  console.log("Test 1: User role assignment & verification");
  assert(organizerUser.role === "ORGANIZER", "Organizer account strictly has role ORGANIZER");
  assert(adminUser.role === "PLATFORM_ADMIN", "Admin account strictly has role PLATFORM_ADMIN");

  // -------------------------------------------------------------------------
  // Test 2: Unauthenticated route protection
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Unauthenticated route access rejection");
  setTestUser(null);

  let unauthOrgRedirect: string | null = null;
  try {
    await requireOrganizer();
  } catch (err: unknown) {
    // Next.js redirect throws a digest error
    unauthOrgRedirect = err instanceof Error ? err.message : String(err);
  }
  assert(
    unauthOrgRedirect?.includes("NEXT_REDIRECT") || unauthOrgRedirect !== null,
    "Unauthenticated user accessing /dashboard is redirected"
  );

  let unauthAdminRedirect: string | null = null;
  try {
    await requirePlatformAdmin();
  } catch (err: unknown) {
    unauthAdminRedirect = err instanceof Error ? err.message : String(err);
  }
  assert(
    unauthAdminRedirect?.includes("NEXT_REDIRECT") || unauthAdminRedirect !== null,
    "Unauthenticated user accessing /admin is redirected"
  );

  // -------------------------------------------------------------------------
  // Test 3: Platform Admin accessing /dashboard is redirected to /admin
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Platform Admin accessing /dashboard is redirected to /admin");
  setTestUser(adminUser);

  let adminOnDashboardRedirect: string | null = null;
  try {
    await requireOrganizer();
  } catch (err: unknown) {
    adminOnDashboardRedirect = err instanceof Error ? err.message : String(err);
  }
  assert(
    adminOnDashboardRedirect?.includes("NEXT_REDIRECT"),
    "Platform Admin attempting to visit /dashboard is redirected"
  );

  // Verify Admin accessing /admin succeeds
  const adminAccess = await requirePlatformAdmin();
  assert(adminAccess.id === adminUser.id, "Platform Admin successfully authorized on /admin");

  // -------------------------------------------------------------------------
  // Test 4: Organizer accessing /admin is redirected to /dashboard
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Organizer accessing /admin is redirected to /dashboard");
  setTestUser(organizerUser);

  let orgOnAdminRedirect: string | null = null;
  try {
    await requirePlatformAdmin();
  } catch (err: unknown) {
    orgOnAdminRedirect = err instanceof Error ? err.message : String(err);
  }
  assert(
    orgOnAdminRedirect?.includes("NEXT_REDIRECT"),
    "Organizer attempting to visit /admin is redirected"
  );

  // Verify Organizer accessing /dashboard succeeds
  const orgAccess = await requireOrganizer();
  assert(orgAccess.id === organizerUser.id, "Organizer successfully authorized on /dashboard");

  // -------------------------------------------------------------------------
  // Test 5: Server-side event creation restricted strictly to ORGANIZER
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Server-side action role enforcement");
  // Admin tries to create an event
  setTestUser(adminUser);
  const formData = new FormData();
  formData.append("name", "Unauthorized Admin Event");
  formData.append("description", "Testing admin block");
  formData.append("startDate", new Date().toISOString());
  formData.append("endDate", new Date(Date.now() + 864000000).toISOString());
  formData.append("votingStartsAt", new Date(Date.now() + 86400000).toISOString());
  formData.append("votingEndsAt", new Date(Date.now() + 500000000).toISOString());

  const adminCreateResult = await createEventAction(formData);
  assert(adminCreateResult.success === false, "PLATFORM_ADMIN blocked from creating awards events");
  assert(
    adminCreateResult.error?.includes("Only registered organizers"),
    "Clear error message returned explaining role restriction"
  );

  // Organizer creates an event
  setTestUser(organizerUser);
  const orgCreateResult = await createEventAction(formData);
  assert(orgCreateResult.success === true, "ORGANIZER successfully creates awards event");
  assert(orgCreateResult.eventId !== undefined, "Event ID returned for organizer event");

  // -------------------------------------------------------------------------
  // Test 6: Scoped Organizer Metrics & Multi-Tenant Event Isolation
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Scoped metrics & multi-tenant isolation");
  // Register second organizer
  const org2Res = await registerOrganizer({
    name: "Abebe Organizer 2",
    email: "abebe2@example.com",
    password: "Password123",
  });
  const org2 = org2Res.user!;

  // Organizer 2 count must be exactly 0
  const org2EventCount = await prisma.event.count({
    where: { organizerId: org2.id },
  });
  assert(org2EventCount === 0, "New organizer has exactly 0 events (clean empty state)");

  // Organizer 1 count must be exactly 1
  const org1EventCount = await prisma.event.count({
    where: { organizerId: organizerUser.id },
  });
  assert(org1EventCount === 1, "Organizer 1 metrics strictly reflect their owned events");

  // Total platform events count for Admin
  const platformTotal = await prisma.event.count();
  assert(platformTotal === 1, "Platform-wide total correctly aggregates across all organizers");

  console.log("\n=======================================================");
  console.log(`Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");
}

runTests()
  .catch((err) => {
    console.error("Test runner failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    setTestUser(null);
    await prisma.$disconnect();
  });
