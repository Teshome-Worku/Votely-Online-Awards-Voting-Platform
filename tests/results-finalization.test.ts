/**
 * Votely Phase 6 Automated Test Suite
 * Covers Results Calculation, Competition Rankings, Tie Handling (Co-Winners),
 * Empty Categories, Finalization Preconditions, Durable Snapshots, Publication Controls,
 * Voter Privacy Protection, and Audit Logging.
 */

import { prisma } from "../src/lib/prisma";
import { registerOrganizer, setTestUser } from "../src/lib/auth";
import { calculateEventResults, getCertifiedSnapshot } from "../src/lib/results";
import {
  finalizeResultsAction,
  publishResultsAction,
  unpublishResultsAction,
  correctFinalizedResultsAction,
} from "../src/actions/results";
import { hashPhoneNumber } from "../src/lib/phone";

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
  console.log("   Votely Phase 6: Results & Finalization Test Suite   ");
  console.log("=======================================================\n");

  // Clean test records only
  await prisma.event.deleteMany({
    where: { organizer: { email: { contains: "test.com" } } },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: "test.com" } },
  });

  // Setup test organizers
  const org1Res = await registerOrganizer({
    name: "Almaz Organizers",
    email: "almaz@test.com",
    password: "Password123",
  });
  const org1 = org1Res.user!;

  const org2Res = await registerOrganizer({
    name: "Bereket Awards",
    email: "bereket@test.com",
    password: "Password123",
  });
  const org2 = org2Res.user!;

  // Create a test awards event
  const now = new Date();
  const event = await prisma.event.create({
    data: {
      name: "Ethiopian Film & Television Awards 2026",
      slug: "ethiopian-film-and-television-awards-2026",
      description: "Annual national awards ceremony honoring outstanding Ethiopian cinema.",
      startDate: new Date(now.getTime() - 7 * 86400000),
      endDate: new Date(now.getTime() + 7 * 86400000),
      votingStartsAt: new Date(now.getTime() - 5 * 86400000),
      votingEndsAt: new Date(now.getTime() - 1 * 86400000), // Voting ended yesterday
      status: "CLOSED", // Event closed for voting, ready for results processing
      votingRule: "ONE_VOTE_PER_CATEGORY",
      organizerId: org1.id,
    },
  });

  // Category 1: Best Director (Decisive Winner)
  const cat1 = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Best Director",
      description: "Excellence in cinematic directing",
      displayOrder: 1,
    },
  });

  const nom1A = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat1.id, name: "Hermon Hailay", displayOrder: 1 },
  });
  const nom1B = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat1.id, name: "Yared Zeleke", displayOrder: 2 },
  });
  const nom1C = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat1.id, name: "Haile Gerima", displayOrder: 3 },
  });

  // Category 2: Best Actor (Exact Tie)
  const cat2 = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Best Actor",
      description: "Outstanding lead performance",
      displayOrder: 2,
    },
  });

  const nom2A = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat2.id, name: "Girma Tadesse", displayOrder: 1 },
  });
  const nom2B = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat2.id, name: "Solomon Bogale", displayOrder: 2 },
  });
  const nom2C = await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat2.id, name: "Kassahun Fisseha", displayOrder: 3 },
  });

  // Category 3: Lifetime Achievement (Empty Category - Zero Votes)
  const cat3 = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Lifetime Achievement",
      description: "Honorary recognition",
      displayOrder: 3,
    },
  });

  await prisma.nominee.create({
    data: { eventId: event.id, categoryId: cat3.id, name: "Abebe Balcha", displayOrder: 1 },
  });

  // Populate accepted votes in PostgreSQL
  // Voters:
  const phoneVoter1 = hashPhoneNumber("+251911000001");
  const phoneVoter2 = hashPhoneNumber("+251911000002");
  const phoneVoter3 = hashPhoneNumber("+251911000003");
  const phoneVoter4 = hashPhoneNumber("+251911000004");
  const phoneVoter5 = hashPhoneNumber("+251911000005");

  // In Category 1:
  // nom1A: 3 votes (Voter 1, 2, 3)
  // nom1B: 1 vote (Voter 4)
  // nom1C: 0 votes
  // Total cat1 votes = 4
  await prisma.vote.createMany({
    data: [
      { eventId: event.id, categoryId: cat1.id, nomineeId: nom1A.id, voterPhoneHash: phoneVoter1 },
      { eventId: event.id, categoryId: cat1.id, nomineeId: nom1A.id, voterPhoneHash: phoneVoter2 },
      { eventId: event.id, categoryId: cat1.id, nomineeId: nom1A.id, voterPhoneHash: phoneVoter3 },
      { eventId: event.id, categoryId: cat1.id, nomineeId: nom1B.id, voterPhoneHash: phoneVoter4 },
    ],
  });

  // In Category 2:
  // nom2A: 2 votes (Voter 1, 2)
  // nom2B: 2 votes (Voter 3, 5) -> Exact Tie with nom2A!
  // nom2C: 1 vote (Voter 4)
  // Total cat2 votes = 5
  await prisma.vote.createMany({
    data: [
      { eventId: event.id, categoryId: cat2.id, nomineeId: nom2A.id, voterPhoneHash: phoneVoter1 },
      { eventId: event.id, categoryId: cat2.id, nomineeId: nom2A.id, voterPhoneHash: phoneVoter2 },
      { eventId: event.id, categoryId: cat2.id, nomineeId: nom2B.id, voterPhoneHash: phoneVoter3 },
      { eventId: event.id, categoryId: cat2.id, nomineeId: nom2B.id, voterPhoneHash: phoneVoter5 },
      { eventId: event.id, categoryId: cat2.id, nomineeId: nom2C.id, voterPhoneHash: phoneVoter4 },
    ],
  });

  // Category 3 has 0 votes cast

  // Total event votes = 4 + 5 = 9
  // Total unique verified voters = 5 distinct voters (Voter 1, 2, 3, 4, 5)

  // -------------------------------------------------------------------------
  // Test 1: Results Calculation Engine & Aggregate Metrics
  // -------------------------------------------------------------------------
  console.log("Test 1: Results calculation engine & aggregate metrics");
  const liveResults = await calculateEventResults(event.id);
  assert(liveResults !== null, "Results calculated successfully");
  assert(liveResults?.totalVotes === 9, "Total accepted votes matches database count exactly (9 votes)");
  assert(liveResults?.totalUniqueVoters === 5, "Total unique voters matches distinct phone hashes (5 voters)");
  assert(liveResults?.categories.length === 3, "All 3 categories included in results");
  assert(liveResults?.isEligibleForFinalization === true, "CLOSED event is marked eligible for finalization");

  // -------------------------------------------------------------------------
  // Test 2: Decisive Category Standings, Ranking & Percentages
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Decisive category standings, ranking & percentages");
  const cat1Results = liveResults?.categories.find((c) => c.categoryId === cat1.id);
  assert(cat1Results !== undefined, "Category 1 results retrieved");
  assert(cat1Results?.totalVotes === 4, "Category 1 total votes equals 4");
  assert(cat1Results?.hasVotes === true, "Category 1 hasVotes is true");
  assert(cat1Results?.isTie === false, "Category 1 isTie is false");
  assert(cat1Results?.winnerStatus === "DECIDED", "Category 1 winnerStatus is DECIDED");
  assert(cat1Results?.winners.length === 1, "Exactly one winner declared for Category 1");
  assert(cat1Results?.winners[0].nomineeId === nom1A.id, "Winner is Hermon Hailay (nom1A)");
  assert(cat1Results?.winners[0].voteCount === 3, "Winner has 3 votes");
  assert(cat1Results?.winners[0].percentage === 75, "Winner received 75% of category vote");

  // Check ranking order (1224)
  const nom1ARes = cat1Results?.nominees.find((n) => n.nomineeId === nom1A.id);
  const nom1BRes = cat1Results?.nominees.find((n) => n.nomineeId === nom1B.id);
  const nom1CRes = cat1Results?.nominees.find((n) => n.nomineeId === nom1C.id);
  assert(nom1ARes?.rank === 1 && nom1ARes?.isWinner === true, "Hermon Hailay ranked #1 and marked winner");
  assert(nom1BRes?.rank === 2 && nom1BRes?.isWinner === false, "Yared Zeleke ranked #2");
  assert(nom1CRes?.rank === 3 && nom1CRes?.voteCount === 0, "Haile Gerima ranked #3 with 0 votes");

  // -------------------------------------------------------------------------
  // Test 3: Documented Tie-Handling Policy & Co-Winners Determination
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Documented tie-handling policy & co-winners determination");
  const cat2Results = liveResults?.categories.find((c) => c.categoryId === cat2.id);
  assert(cat2Results !== undefined, "Category 2 results retrieved");
  assert(cat2Results?.totalVotes === 5, "Category 2 total votes equals 5");
  assert(cat2Results?.isTie === true, "Category 2 explicitly identified as a tie");
  assert(cat2Results?.winnerStatus === "CO_WINNERS", "Category 2 winner status is formally CO_WINNERS");
  assert(cat2Results?.winners.length === 2, "Both tied leaders are recognized as co-winners");

  const nom2ARes = cat2Results?.nominees.find((n) => n.nomineeId === nom2A.id);
  const nom2BRes = cat2Results?.nominees.find((n) => n.nomineeId === nom2B.id);
  const nom2CRes = cat2Results?.nominees.find((n) => n.nomineeId === nom2C.id);

  assert(nom2ARes?.rank === 1 && nom2ARes?.voteCount === 2, "Girma Tadesse shares rank 1 with 2 votes");
  assert(nom2BRes?.rank === 1 && nom2BRes?.voteCount === 2, "Solomon Bogale shares rank 1 with 2 votes");
  assert(nom2ARes?.isWinner === true && nom2ARes?.isTie === true, "Girma marked as co-winner (isTie: true)");
  assert(nom2BRes?.isWinner === true && nom2BRes?.isTie === true, "Solomon marked as co-winner (isTie: true)");
  // In standard competition ranking 1, 1, 3: next rank skips to #3
  assert(nom2CRes?.rank === 3, "3rd place nominee correctly skips to rank #3 under 1224 ranking");
  assert(nom2CRes?.isWinner === false, "3rd place nominee is not marked winner");

  // -------------------------------------------------------------------------
  // Test 4: Empty Category Handling (Zero Votes)
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Empty category handling (zero votes)");
  const cat3Results = liveResults?.categories.find((c) => c.categoryId === cat3.id);
  assert(cat3Results !== undefined, "Category 3 results retrieved");
  assert(cat3Results?.totalVotes === 0, "Category 3 has 0 total votes");
  assert(cat3Results?.hasVotes === false, "Category 3 hasVotes is false");
  assert(cat3Results?.winnerStatus === "NO_VOTES_CAST", "Category 3 winnerStatus is NO_VOTES_CAST");
  assert(cat3Results?.winners.length === 0, "No winner declared when 0 votes cast");
  assert(cat3Results?.nominees[0].percentage === 0, "Zero votes handled cleanly without division by zero");
  assert(cat3Results?.nominees[0].isWinner === false, "Zero-vote nominee is not declared winner");

  // -------------------------------------------------------------------------
  // Test 5: Voter Privacy Protection (Zero Leakage)
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Voter privacy protection (zero leakage)");
  const resultsJson = JSON.stringify(liveResults);
  assert(!resultsJson.includes("+251"), "Plaintext phone numbers strictly absent from results DTO");
  assert(!resultsJson.includes(phoneVoter1), "Voter phone hashes strictly absent from results DTO");
  assert(!resultsJson.includes("otp"), "OTP fields strictly absent from results DTO");

  // -------------------------------------------------------------------------
  // Test 6: Finalization Preconditions & Lifecycle Enforcing
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Finalization preconditions & lifecycle enforcement");
  // Unauthenticated call rejected
  setTestUser(null);
  const unauthNoSession = await finalizeResultsAction({ eventId: event.id });
  assert(unauthNoSession.success === false, "Unauthenticated call to finalize results rejected");
  assert(unauthNoSession.error?.includes("Authentication required"), "Authentication error message returned");

  // Authenticate as event owner (Organizer 1)
  setTestUser(org1);

  // Create an active LIVE event owned by Organizer 1
  const liveEvent = await prisma.event.create({
    data: {
      name: "Live Music Event",
      slug: "live-music-event",
      description: "Music event in progress",
      startDate: now,
      endDate: new Date(now.getTime() + 86400000),
      votingStartsAt: now,
      votingEndsAt: new Date(now.getTime() + 86400000),
      status: "LIVE",
      organizerId: org1.id,
    },
  });

  // Attempting to finalize a LIVE event must be rejected
  const prematureFinalize = await finalizeResultsAction({ eventId: liveEvent.id });
  assert(prematureFinalize.success === false, "Premature finalization of LIVE event rejected");
  assert(prematureFinalize.error?.includes("CLOSED"), "Error clearly specifies event must be in CLOSED status");

  // -------------------------------------------------------------------------
  // Test 7: Multi-Tenant Authorization for Finalization
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Multi-tenant authorization for finalization");
  // Switch to Organizer 2
  setTestUser(org2);

  // Organizer 2 attempts to finalize Organizer 1's closed event
  const unauthFinalize = await finalizeResultsAction({ eventId: event.id });
  assert(unauthFinalize.success === false, "Unauthorized organizer blocked from finalizing other organizer's event");
  assert(unauthFinalize.error?.includes("Unauthorized"), "Unauthorized error message returned");

  // -------------------------------------------------------------------------
  // Test 8: Atomic Finalization & Durable Snapshot Creation
  // -------------------------------------------------------------------------
  console.log("\nTest 8: Atomic finalization & durable snapshot creation");
  // Authenticate back as Organizer 1 (owner)
  setTestUser(org1);

  const finalizeRes = await finalizeResultsAction({
    eventId: event.id,
    note: "Official certification of 2026 winners",
  });
  assert(finalizeRes.success === true, "Results successfully finalized by event owner");
  assert(finalizeRes.version === 1, "Snapshot version 1 issued");

  // Verify event state transition in database
  const updatedEvent = await prisma.event.findUnique({ where: { id: event.id } });
  assert(updatedEvent?.status === "FINALIZED", "Event status transitioned to FINALIZED in PostgreSQL");
  assert(updatedEvent?.finalizedAt !== null, "Finalized timestamp recorded");
  assert(updatedEvent?.finalizedById === org1.id, "Actor who finalized is recorded durably");

  // Verify durable snapshot
  const snapshot = await getCertifiedSnapshot(event.id);
  assert(snapshot !== null, "Durable snapshot retrieved from database");
  assert(snapshot?.version === 1, "Snapshot version matches");
  assert(snapshot?.totalVotes === 9, "Snapshot preserves total votes (9)");
  assert(snapshot?.totalVoters === 5, "Snapshot preserves total verified voters (5)");
  assert(snapshot?.finalizedById === org1.id, "Snapshot links to authorizing organizer");

  // -------------------------------------------------------------------------
  // Test 9: Public Access Controls (Publication & Unpublication)
  // -------------------------------------------------------------------------
  console.log("\nTest 9: Public access controls (publication & unpublication)");
  // Initially, after finalization, results are NOT yet published
  assert(updatedEvent?.resultsPublished === false, "Finalized results default to resultsPublished: false");

  // Organizer 2 attempts to publish Organizer 1's results
  setTestUser(org2);
  const unauthPublish = await publishResultsAction(event.id);
  assert(unauthPublish.success === false, "Unauthorized organizer cannot publish results");

  // Owner publishes results
  setTestUser(org1);
  const publishRes = await publishResultsAction(event.id);
  assert(publishRes.success === true, "Results published successfully by owner");

  const pubEvent = await prisma.event.findUnique({ where: { id: event.id } });
  assert(pubEvent?.resultsPublished === true, "Event resultsPublished is true in database");
  assert(pubEvent?.resultsPublishedAt !== null, "Publication timestamp recorded");

  // Owner unpublishes results
  const unpubRes = await unpublishResultsAction(event.id);
  assert(unpubRes.success === true, "Results unpublished successfully");
  const unpubEvent = await prisma.event.findUnique({ where: { id: event.id } });
  assert(unpubEvent?.resultsPublished === false, "Event resultsPublished restored to false");

  // Re-publish for public view
  await publishResultsAction(event.id);

  // -------------------------------------------------------------------------
  // Test 10: Authorized Corrections & Versioned Snapshots
  // -------------------------------------------------------------------------
  console.log("\nTest 10: Authorized corrections & versioned snapshots");
  setTestUser(org1);
  const correctionRes = await correctFinalizedResultsAction({
    eventId: event.id,
    correctionNote: "Recount verified by third-party audit committee.",
  });
  assert(correctionRes.success === true, "Authorized correction recorded successfully");
  assert(correctionRes.version === 2, "Snapshot version incremented to v2");

  // Verify historical snapshots both exist
  const allSnapshots = await prisma.finalizedResultSnapshot.findMany({
    where: { eventId: event.id },
    orderBy: { version: "asc" },
  });
  assert(allSnapshots.length === 2, "Both snapshot v1 and v2 preserved in history");
  assert(allSnapshots[0].version === 1, "Snapshot v1 intact");
  assert(allSnapshots[1].version === 2, "Snapshot v2 intact with audit note");
  assert(allSnapshots[1].note?.includes("audit committee"), "Correction note captured durably");

  // -------------------------------------------------------------------------
  // Test 11: Audit Trail Verification
  // -------------------------------------------------------------------------
  console.log("\nTest 11: Audit trail verification");
  const auditLogs = await prisma.auditLog.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
  });
  const actions = auditLogs.map((l) => l.action);
  assert(actions.includes("RESULTS_FINALIZED"), "Audit log recorded RESULTS_FINALIZED");
  assert(actions.includes("RESULTS_PUBLISHED"), "Audit log recorded RESULTS_PUBLISHED");
  assert(actions.includes("RESULTS_UNPUBLISHED"), "Audit log recorded RESULTS_UNPUBLISHED");
  assert(actions.includes("RESULTS_CORRECTED"), "Audit log recorded RESULTS_CORRECTED");
  assert(auditLogs.every((l) => l.userId === org1.id), "All audit entries correctly track the acting user");

  console.log("\n=======================================================");
  console.log(`Phase 6 Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
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
