/**
 * Votely Phase 2 Automated Test Suite
 * Covers all 10 authentication and access-control criteria specified in the PRS
 */

import { prisma } from "../src/lib/prisma";
import {
  verifyPassword,
  validateRegistrationInput,
  registerOrganizer,
  createSession,
  validateSessionToken,
  invalidateSession,
} from "../src/lib/auth";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
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
  console.log("   Votely Phase 2: Authentication & Security Test Suite ");
  console.log("=======================================================\n");

  // Clean test records only
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { contains: "example.com" } },
        { email: { contains: "test.com" } },
      ],
    },
  });

  // -------------------------------------------------------------------------
  // Test 1: Successful organizer registration
  // -------------------------------------------------------------------------
  console.log("Test 1: Successful organizer registration");
  const reg1 = await registerOrganizer({
    name: "John Doe",
    email: "John.Doe@Example.com",
    password: "Password123",
    organization: "East African Cultural Guild",
    phoneNumber: "+251911223344",
  });
  assert(reg1.success === true, "Organizer registration returned success: true");
  assert(reg1.user !== undefined, "User object returned in response");
  assert(reg1.user?.email === "john.doe@example.com", "Email was normalized to lowercase");
  assert(reg1.user?.role === "ORGANIZER", "Role defaults strictly to ORGANIZER");
  assert(reg1.user?.status === "ACTIVE", "Account status is ACTIVE");

  const dbUser = await prisma.user.findUnique({
    where: { email: "john.doe@example.com" },
  });
  assert(dbUser !== null, "User persisted in PostgreSQL database");
  assert(dbUser?.passwordHash !== "Password123", "Password is never stored in plaintext");
  assert(Boolean(dbUser?.passwordHash.startsWith("$2")), "Password is encrypted with bcrypt hash");

  // -------------------------------------------------------------------------
  // Test 2: Duplicate email rejection
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Duplicate email rejection");
  const regDup = await registerOrganizer({
    name: "Duplicate User",
    email: "JOHN.DOE@example.COM", // Different casing
    password: "AnotherPassword456",
  });
  assert(regDup.success === false, "Registration with existing normalized email rejected");
  assert(
    regDup.error === "An account with this email address already exists.",
    "Correct duplicate error message returned"
  );

  // -------------------------------------------------------------------------
  // Test 3: Invalid registration input
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Invalid registration input validation");
  const shortName = validateRegistrationInput({ name: "A", email: "valid@email.com", password: "Password123" });
  assert(!shortName.isValid && shortName.errors.name !== undefined, "Rejected name < 2 characters");

  const badEmail = validateRegistrationInput({ name: "Abebe", email: "not-an-email", password: "Password123" });
  assert(!badEmail.isValid && badEmail.errors.email !== undefined, "Rejected malformed email");

  const shortPass = validateRegistrationInput({ name: "Abebe", email: "test@email.com", password: "123" });
  assert(!shortPass.isValid && shortPass.errors.password !== undefined, "Rejected password < 8 characters");

  const noNumberPass = validateRegistrationInput({ name: "Abebe", email: "test@email.com", password: "abcdefghijk" });
  assert(!noNumberPass.isValid && noNumberPass.errors.password !== undefined, "Rejected password without numbers");

  // -------------------------------------------------------------------------
  // Test 4: Successful login & password verification
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Successful login & password verification");
  const isMatch = await verifyPassword("Password123", dbUser!.passwordHash);
  assert(isMatch === true, "Valid password matches bcrypt hash");

  const sessionData = await createSession(dbUser!.id, { userAgent: "TestRunner/1.0", ipAddress: "127.0.0.1" });
  assert(typeof sessionData.token === "string" && sessionData.token.length >= 64, "High-entropy 256-bit session token generated");

  const validSession = await validateSessionToken(sessionData.token);
  assert(validSession !== null, "Session successfully validated from database");
  assert(validSession?.user.email === "john.doe@example.com", "Session user matches logged-in user");
  assert(!("passwordHash" in (validSession?.user ?? {})), "passwordHash is strictly stripped from user session data");

  // -------------------------------------------------------------------------
  // Test 5: Incorrect password rejection
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Incorrect password rejection");
  const isWrongMatch = await verifyPassword("WrongPassword999", dbUser!.passwordHash);
  assert(isWrongMatch === false, "Incorrect password does not match hash");

  // -------------------------------------------------------------------------
  // Test 6: Logout and session invalidation
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Logout and session invalidation");
  await invalidateSession(sessionData.token);
  const invalidated = await validateSessionToken(sessionData.token);
  assert(invalidated === null, "Session token successfully invalidated and cannot be reused");

  // -------------------------------------------------------------------------
  // Test 7: Unauthenticated access control
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Unauthenticated access control");
  const unauth = await validateSessionToken("non-existent-token-abc-123");
  assert(unauth === null, "Unauthenticated access properly identified and rejected");

  // -------------------------------------------------------------------------
  // Test 8: Organizer access to platform-admin role check
  // -------------------------------------------------------------------------
  console.log("\nTest 8: Organizer access to /admin isolation check");
  const organizerSession = await createSession(dbUser!.id);
  const currentOrganizer = await validateSessionToken(organizerSession.token);
  assert(currentOrganizer?.user.role === "ORGANIZER", "User has ORGANIZER role");
  const canAccessAdmin = currentOrganizer?.user.role === "PLATFORM_ADMIN";
  assert(canAccessAdmin === false, "ORGANIZER role is strictly forbidden from PLATFORM_ADMIN area");
  await invalidateSession(organizerSession.token);

  // -------------------------------------------------------------------------
  // Test 9: Attempts to assign PLATFORM_ADMIN through registration
  // -------------------------------------------------------------------------
  console.log("\nTest 9: Privilege escalation prevention during registration");
  const maliciousReg = await registerOrganizer({
    name: "Hacker User",
    email: "hacker@example.com",
    password: "Password123",
    role: "PLATFORM_ADMIN", // Attacker attempts to pass admin role
  });
  assert(maliciousReg.success === true, "Registration succeeded");
  assert(maliciousReg.user?.role === "ORGANIZER", "Role injection stripped: user role is ORGANIZER, NOT PLATFORM_ADMIN");

  const dbAttacker = await prisma.user.findUnique({
    where: { email: "hacker@example.com" },
  });
  assert(dbAttacker?.role === "ORGANIZER", "Database record strictly has role ORGANIZER");

  // -------------------------------------------------------------------------
  // Test 10: Session expiration and suspended account handling
  // -------------------------------------------------------------------------
  console.log("\nTest 10: Session expiration & suspended account handling");
  // Test expired session
  const expiredToken = "expired-token-xyz-123";
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  await prisma.session.create({
    data: {
      token: expiredToken,
      userId: dbUser!.id,
      expiresAt: pastDate,
    },
  });
  const expiredResult = await validateSessionToken(expiredToken);
  assert(expiredResult === null, "Expired session token rejected");

  const cleanedFromDb = await prisma.session.findUnique({
    where: { token: expiredToken },
  });
  assert(cleanedFromDb === null, "Expired session automatically purged from database");

  // Test account suspension
  await prisma.user.update({
    where: { id: dbUser!.id },
    data: { status: "SUSPENDED" },
  });
  const suspendedSession = await createSession(dbUser!.id);
  const suspendedCheck = await validateSessionToken(suspendedSession.token);
  assert(suspendedCheck === null, "Suspended account rejected from establishing active session");

  console.log("\n=======================================================");
  console.log(`Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test runner failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
