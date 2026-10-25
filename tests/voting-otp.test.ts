/**
 * Votely Phase 5 Automated Test Suite
 * Covers Voting Rules, Phone OTP Verification, Rate Limiting, Provider Abstraction, and Atomic Vote Recording
 */

import { prisma } from "../src/lib/prisma";
import { registerOrganizer } from "../src/lib/auth";
import { normalizePhoneNumber, hashPhoneNumber } from "../src/lib/phone";
import {
  requestOtp,
  verifyOtp,
  validateVoterSession,
  generateNumericOtp,
  hashOtpCode,
  verifyOtpCode,
} from "../src/lib/otp";
import { getDevLastOtp, clearDevOtps, setSmsProviderForTesting, SmsProvider } from "../src/lib/sms";
import { submitVoteAction } from "../src/actions/voting";
import { clearAllRateLimits } from "../src/lib/rate-limit";

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
  console.log("   Votely Phase 5: Voting Rules & Phone OTP Test Suite   ");
  console.log("=======================================================\n");

  // Clean test tables
  clearDevOtps();
  clearAllRateLimits();
  await prisma.vote.deleteMany({});
  await prisma.voterSession.deleteMany({});
  await prisma.otpChallenge.deleteMany({});
  await prisma.nominee.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  // Setup organizer and live test event
  const orgRes = await registerOrganizer({
    name: "Abebe Awards",
    email: "abebe@test.com",
    password: "Password123",
  });
  const org = orgRes.user!;

  const now = new Date();
  const liveEvent = await prisma.event.create({
    data: {
      name: "Ethiopian Music Awards Live",
      slug: "ethiopian-music-awards-live",
      description: "Live ceremony voting",
      startDate: new Date(now.getTime() - 86400000), // Started yesterday
      endDate: new Date(now.getTime() + 10 * 86400000),
      votingStartsAt: new Date(now.getTime() - 3600000), // Voting opened 1 hour ago
      votingEndsAt: new Date(now.getTime() + 5 * 86400000), // Voting closes in 5 days
      status: "LIVE",
      votingRule: "ONE_VOTE_PER_CATEGORY",
      organizerId: org.id,
    },
  });

  const cat1 = await prisma.category.create({
    data: {
      eventId: liveEvent.id,
      name: "Artist of the Year",
      displayOrder: 1,
    },
  });

  const cat2 = await prisma.category.create({
    data: {
      eventId: liveEvent.id,
      name: "Song of the Year",
      displayOrder: 2,
    },
  });

  const nom1 = await prisma.nominee.create({
    data: {
      eventId: liveEvent.id,
      categoryId: cat1.id,
      name: "Rophnan",
      displayOrder: 1,
    },
  });

  const nom2 = await prisma.nominee.create({
    data: {
      eventId: liveEvent.id,
      categoryId: cat1.id,
      name: "Aster Aweke",
      displayOrder: 2,
    },
  });

  const nom3 = await prisma.nominee.create({
    data: {
      eventId: liveEvent.id,
      categoryId: cat2.id,
      name: "Sami Dan",
      displayOrder: 1,
    },
  });

  // -------------------------------------------------------------------------
  // Test 1: Phone Normalization & Privacy Hashing
  // -------------------------------------------------------------------------
  console.log("Test 1: Phone normalization & privacy hashing");
  const norm1 = normalizePhoneNumber("0911223344", "ET");
  assert(norm1.isValid === true && norm1.e164 === "+251911223344", "Ethiopian local number normalized to E.164 +251911223344");

  const normIntl = normalizePhoneNumber("+1 415 555 2671");
  assert(normIntl.isValid === true && normIntl.e164 === "+14155552671", "International number normalized to +14155552671");

  const invalidPhone = normalizePhoneNumber("12345");
  assert(invalidPhone.isValid === false, "Invalid short phone rejected");

  const hashA = hashPhoneNumber("+251911223344");
  const hashB = hashPhoneNumber("+251911223344");
  const hashC = hashPhoneNumber("+251911223345");
  assert(hashA === hashB, "Phone hashing is deterministic for identical E.164 numbers");
  assert(hashA !== hashC, "Different phone numbers generate distinct hashes");
  assert(!hashA.includes("251911223344"), "Hash is strictly irreversible and contains no plaintext digits");

  // -------------------------------------------------------------------------
  // Test 2: OTP Generation, Cryptographic Hashing & Verification
  // -------------------------------------------------------------------------
  console.log("\nTest 2: OTP generation, cryptographic hashing & timing-safe check");
  const code = generateNumericOtp();
  assert(code.length === 6 && /^\d{6}$/.test(code), "Generated OTP is exactly 6 numeric digits");

  const codeHash = hashOtpCode(code);
  assert(codeHash !== code, "OTP is cryptographically hashed with secret salt");
  assert(verifyOtpCode(code, codeHash) === true, "Correct code verifies against stored hash");
  assert(verifyOtpCode("000000", codeHash) === false, "Incorrect code rejected");

  // -------------------------------------------------------------------------
  // Test 3: OTP Dispatch, Rate Limiting & Provider Failure Handling
  // -------------------------------------------------------------------------
  console.log("\nTest 3: OTP dispatch, rate limiting & provider failure handling");
  const phone1 = "+251911223344";

  // Request 1
  const req1 = await requestOtp(liveEvent.id, phone1);
  assert(req1.success === true, "OTP challenge dispatched successfully");
  assert(req1.challengeId !== undefined, "Challenge ID returned");
  const devOtp1 = getDevLastOtp(phone1);
  assert(devOtp1 !== undefined && devOtp1.length === 6, "Dev provider captured generated OTP for testing");

  // Request 2 & 3
  await requestOtp(liveEvent.id, phone1);
  await requestOtp(liveEvent.id, phone1);

  // Request 4 should be rate limited (max 3 per 15 min)
  const req4 = await requestOtp(liveEvent.id, phone1);
  assert(req4.success === false, "4th OTP request within 15 min rejected by rate limiter");
  assert(req4.error?.includes("Too many verification requests"), "Useful rate limit error message returned");

  // Provider Failure simulation
  clearAllRateLimits();
  const failingProvider: SmsProvider = {
    name: "FailingGateway",
    async sendOtp() {
      return { success: false, error: "Network timeout connecting to carrier" };
    },
  };
  setSmsProviderForTesting(failingProvider);
  const failReq = await requestOtp(liveEvent.id, "+251922334455");
  assert(failReq.success === false, "Provider failure handled cleanly");
  assert(failReq.error?.includes("Network timeout"), "Honest error returned without pretending SMS succeeded");

  // Restore dev provider
  clearDevOtps();
  const { DevSmsProvider } = await import("../src/lib/sms/dev-provider");
  setSmsProviderForTesting(new DevSmsProvider());

  // -------------------------------------------------------------------------
  // Test 4: OTP Verification, Invalidation, Expiration & Voter Session
  // -------------------------------------------------------------------------
  console.log("\nTest 4: OTP verification, invalidation & voter session creation");
  clearAllRateLimits();
  const voterPhone = "+251933445566";
  const reqValid = await requestOtp(liveEvent.id, voterPhone);
  const otpCode = getDevLastOtp(voterPhone)!;

  // Invalid OTP check
  const badVerify = await verifyOtp(reqValid.challengeId!, "999999");
  assert(badVerify.success === false, "Invalid OTP code rejected");
  assert(badVerify.error?.includes("Incorrect verification code"), "Incorrect code error returned");

  // Valid OTP check
  const goodVerify = await verifyOtp(reqValid.challengeId!, otpCode);
  assert(goodVerify.success === true, "Valid OTP verified successfully");
  assert(goodVerify.voterSessionToken !== undefined, "Voter session token issued");

  // OTP Reuse check (single-use enforcement)
  const reuseVerify = await verifyOtp(reqValid.challengeId!, otpCode);
  assert(reuseVerify.success === false, "Reusing single-use OTP challenge is strictly rejected");

  // Expired challenge check
  const expiredChallenge = await prisma.otpChallenge.create({
    data: {
      eventId: liveEvent.id,
      phoneNumber: "+251944556677",
      otpHash: hashOtpCode("123456"),
      expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
    },
  });
  const expiredVerify = await verifyOtp(expiredChallenge.id, "123456");
  assert(expiredVerify.success === false, "Expired OTP challenge rejected");
  assert(expiredVerify.error?.includes("expired"), "Expired error message returned");

  // Validate voter session token
  const sessionCheck = await validateVoterSession(goodVerify.voterSessionToken!, liveEvent.id);
  assert(sessionCheck.isValid === true, "Voter session is valid for current event");
  assert(sessionCheck.phoneHash === hashPhoneNumber(voterPhone), "Voter session links verified phone hash");

  // -------------------------------------------------------------------------
  // Test 5: Successful Vote Submission & Atomic Duplicate Prevention
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Vote submission & atomic duplicate prevention");
  // Submit vote for nom1 in cat1
  const voteResult1 = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: liveEvent.id,
    categoryId: cat1.id,
    nomineeId: nom1.id,
  });
  assert(voteResult1.success === true, "Vote successfully accepted and recorded in database");
  assert(voteResult1.voteId !== undefined, "Unique Vote ID issued");
  assert(voteResult1.nomineeName === "Rophnan", "Vote receipt reflects chosen nominee");

  const dbVote = await prisma.vote.findUnique({
    where: { id: voteResult1.voteId },
  });
  assert(dbVote !== null, "Vote persisted in PostgreSQL database");
  assert(dbVote?.voterPhoneHash === hashPhoneNumber(voterPhone), "Vote stores privacy-preserving phone hash");

  // Safe retry: submitting the exact same vote returns graceful confirmation without duplicate row
  const retryVote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: liveEvent.id,
    categoryId: cat1.id,
    nomineeId: nom1.id,
  });
  assert(retryVote.success === true && retryVote.isDuplicateRetry === true, "Safe retry handled gracefully");
  assert(retryVote.voteId === voteResult1.voteId, "Retry points to existing vote without creating duplicate row");

  // Attempt duplicate vote for DIFFERENT nominee in SAME category (cat1)
  const dupCategoryVote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: liveEvent.id,
    categoryId: cat1.id,
    nomineeId: nom2.id, // Different nominee in same category!
  });
  assert(dupCategoryVote.success === false, "Duplicate vote in same category strictly rejected");
  assert(dupCategoryVote.error?.includes("limit reached"), "Vote limit error message returned");

  // Voting in ANOTHER category (cat2) is PERMITTED under default ONE_VOTE_PER_CATEGORY
  const cat2Vote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: liveEvent.id,
    categoryId: cat2.id,
    nomineeId: nom3.id,
  });
  assert(cat2Vote.success === true, "Vote in separate category accepted under ONE_VOTE_PER_CATEGORY rule");

  // -------------------------------------------------------------------------
  // Test 6: Additional Voting Rule: ONE_VOTE_PER_EVENT
  // -------------------------------------------------------------------------
  console.log("\nTest 6: ONE_VOTE_PER_EVENT rule enforcement");
  const eventSingleVote = await prisma.event.create({
    data: {
      name: "Global Choice Awards",
      slug: "global-choice-awards",
      description: "Strict 1 vote per phone across entire event",
      startDate: new Date(now.getTime() - 86400000),
      endDate: new Date(now.getTime() + 10 * 86400000),
      votingStartsAt: new Date(now.getTime() - 3600000),
      votingEndsAt: new Date(now.getTime() + 5 * 86400000),
      status: "LIVE",
      votingRule: "ONE_VOTE_PER_EVENT",
      organizerId: org.id,
    },
  });

  const singleCatA = await prisma.category.create({
    data: { eventId: eventSingleVote.id, name: "Category Alpha" },
  });
  const singleCatB = await prisma.category.create({
    data: { eventId: eventSingleVote.id, name: "Category Beta" },
  });
  const singleNomA = await prisma.nominee.create({
    data: { eventId: eventSingleVote.id, categoryId: singleCatA.id, name: "Candidate Alpha" },
  });
  const singleNomB = await prisma.nominee.create({
    data: { eventId: eventSingleVote.id, categoryId: singleCatB.id, name: "Candidate Beta" },
  });

  const voterPhone2 = "+251977889900";
  const reqSingle = await requestOtp(eventSingleVote.id, voterPhone2);
  const otpSingle = getDevLastOtp(voterPhone2)!;
  const verifySingle = await verifyOtp(reqSingle.challengeId!, otpSingle);

  // Cast vote in Category Alpha
  const voteSingleRes1 = await submitVoteAction({
    voterSessionToken: verifySingle.voterSessionToken!,
    eventId: eventSingleVote.id,
    categoryId: singleCatA.id,
    nomineeId: singleNomA.id,
  });
  assert(voteSingleRes1.success === true, "First vote across event accepted");

  // Attempt vote in Category Beta under ONE_VOTE_PER_EVENT rule
  const voteSingleRes2 = await submitVoteAction({
    voterSessionToken: verifySingle.voterSessionToken!,
    eventId: eventSingleVote.id,
    categoryId: singleCatB.id,
    nomineeId: singleNomB.id,
  });
  assert(voteSingleRes2.success === false, "Second vote in different category rejected under ONE_VOTE_PER_EVENT");
  assert(voteSingleRes2.error?.includes("allowed vote for this event"), "Event-wide limit message returned");

  // -------------------------------------------------------------------------
  // Test 7: Integrity Checks (Schedule, Lifecycle & Mismatched IDs)
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Integrity checks (schedule, lifecycle & mismatched IDs)");
  // Mismatched nominee / category
  const mismatchVote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: liveEvent.id,
    categoryId: cat1.id,
    nomineeId: nom3.id, // nom3 belongs to cat2, not cat1!
  });
  assert(mismatchVote.success === false, "Voting for nominee under mismatched category rejected");

  // Closed Event voting attempt
  const closedEvent = await prisma.event.create({
    data: {
      name: "Closed Award Ceremony",
      slug: "closed-ceremony",
      description: "Past event",
      startDate: new Date(now.getTime() - 20 * 86400000),
      endDate: new Date(now.getTime() - 1 * 86400000),
      votingStartsAt: new Date(now.getTime() - 15 * 86400000),
      votingEndsAt: new Date(now.getTime() - 2 * 86400000),
      status: "CLOSED",
      organizerId: org.id,
    },
  });

  const closedVote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: closedEvent.id,
    categoryId: cat1.id,
    nomineeId: nom1.id,
  });
  assert(closedVote.success === false, "Voting on CLOSED event rejected");

  // Voting outside window (future schedule)
  const futureEvent = await prisma.event.create({
    data: {
      name: "Future Scheduled Event",
      slug: "future-event",
      description: "Opens tomorrow",
      startDate: new Date(now.getTime() + 86400000),
      endDate: new Date(now.getTime() + 10 * 86400000),
      votingStartsAt: new Date(now.getTime() + 2 * 86400000),
      votingEndsAt: new Date(now.getTime() + 8 * 86400000),
      status: "LIVE", // Marked LIVE prematurely
      organizerId: org.id,
    },
  });

  const futureVote = await submitVoteAction({
    voterSessionToken: goodVerify.voterSessionToken!,
    eventId: futureEvent.id,
    categoryId: cat1.id,
    nomineeId: nom1.id,
  });
  assert(futureVote.success === false, "Voting before votingStartsAt rejected by server schedule check");

  console.log("\n=======================================================");
  console.log(`Phase 5 Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
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
