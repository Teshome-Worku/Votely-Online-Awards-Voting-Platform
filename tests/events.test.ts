/**
 * Votely Phase 3 Automated Test Suite
 * Covers Event Creation, Editing, Slugs, Lifecycle, and Ownership Protection
 */

import { prisma } from "../src/lib/prisma";
import { registerOrganizer } from "../src/lib/auth";
import { generateUniqueSlug, slugify } from "../src/lib/slug";
import { validateEventInput } from "../src/lib/event-validation";
import { isAllowedTransition, isPubliclyVisibleStatus } from "../src/lib/event-lifecycle";

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
  console.log("   Votely Phase 3: Events & Lifecycle Test Suite        ");
  console.log("=======================================================\n");

  // Clean only automated test records (protect user created events)
  await prisma.event.deleteMany({
    where: {
      OR: [
        { organizer: { email: { contains: "test.com" } } },
        { slug: { startsWith: "ethiopian-music" } },
        { slug: { startsWith: "private-internal" } },
      ],
    },
  });
  await prisma.user.deleteMany({
    where: { email: { contains: "test.com" } },
  });

  // Setup test organizers
  const org1Res = await registerOrganizer({
    name: "Organizer One",
    email: "org1@test.com",
    password: "Password123",
    organization: "Addis Creative Lab",
  });
  const org1 = org1Res.user!;

  const org2Res = await registerOrganizer({
    name: "Organizer Two",
    email: "org2@test.com",
    password: "Password123",
    organization: "Oromia Arts Circle",
  });
  const org2 = org2Res.user!;

  // -------------------------------------------------------------------------
  // Test 1: Slug Generation and Collision Handling
  // -------------------------------------------------------------------------
  console.log("Test 1: Slug generation & collision handling");
  const rawTitle = "Ethiopian Music & Film Awards 2026!";
  const baseSlug = slugify(rawTitle);
  assert(baseSlug === "ethiopian-music-film-awards-2026", "Slugify produces clean lowercase hyphenated string");

  const slug1 = await generateUniqueSlug(rawTitle);
  assert(slug1 === "ethiopian-music-film-awards-2026", "First slug matches base slug");

  // Create an event with slug1
  const now = new Date();
  const startDate = new Date(now.getTime() + 1 * 86400000);
  const vStarts = new Date(now.getTime() + 2 * 86400000);
  const vEnds = new Date(now.getTime() + 15 * 86400000);
  const endDate = new Date(now.getTime() + 20 * 86400000);

  const event1 = await prisma.event.create({
    data: {
      name: rawTitle,
      slug: slug1,
      description: "Celebrating Ethiopian excellence across music, digital media, and film.",
      startDate,
      endDate,
      votingStartsAt: vStarts,
      votingEndsAt: vEnds,
      organizerId: org1.id,
      status: "DRAFT",
    },
  });
  assert(event1.id !== undefined, "Event successfully created and stored in PostgreSQL");

  // Attempt duplicate slug generation
  const slug2 = await generateUniqueSlug(rawTitle);
  assert(slug2 === "ethiopian-music-film-awards-2026-2", "Slug collision cleanly resolved with '-2' suffix");

  // -------------------------------------------------------------------------
  // Test 2: Input Validation and Date Ordering Enforcement
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Input validation & date ordering enforcement");
  // Short title
  const invalidName = validateEventInput({
    name: "AB",
    description: "Valid description longer than ten characters",
    startDate,
    endDate,
    votingStartsAt: vStarts,
    votingEndsAt: vEnds,
  });
  assert(!invalidName.isValid && invalidName.errors.name !== undefined, "Rejected name < 3 characters");

  // End date before start date
  const badEndDate = validateEventInput({
    name: "Valid Event Title",
    description: "Valid description longer than ten characters",
    startDate: endDate,
    endDate: startDate, // Inverted!
    votingStartsAt: vStarts,
    votingEndsAt: vEnds,
  });
  assert(!badEndDate.isValid && badEndDate.errors.endDate !== undefined, "Rejected endDate <= startDate");

  // Voting opens before event start
  const earlyVoting = validateEventInput({
    name: "Valid Event Title",
    description: "Valid description longer than ten characters",
    startDate: vStarts,
    endDate: endDate,
    votingStartsAt: startDate, // Voting starts before event begins!
    votingEndsAt: vEnds,
  });
  assert(!earlyVoting.isValid && earlyVoting.errors.votingStartsAt !== undefined, "Rejected voting starts before event start");

  // Voting close before voting open
  const invertedVoting = validateEventInput({
    name: "Valid Event Title",
    description: "Valid description longer than ten characters",
    startDate,
    endDate,
    votingStartsAt: vEnds,
    votingEndsAt: vStarts, // Inverted!
  });
  assert(!invertedVoting.isValid && invertedVoting.errors.votingEndsAt !== undefined, "Rejected votingEndsAt <= votingStartsAt");

  // Valid dates pass
  const validForm = validateEventInput({
    name: "National Heritage Awards",
    description: "Honoring national cultural heritage preservers and innovators.",
    startDate,
    endDate,
    votingStartsAt: vStarts,
    votingEndsAt: vEnds,
  });
  assert(validForm.isValid, "Valid form and chronologically ordered dates accepted");

  // -------------------------------------------------------------------------
  // Test 3: Event Retrieval and Editing
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Event retrieval and editing");
  const retrieved = await prisma.event.findUnique({
    where: { id: event1.id },
  });
  assert(retrieved !== null && retrieved.name === rawTitle, "Event successfully retrieved by ID");

  const updatedName = "Ethiopian Music & Film Awards (Updated)";
  const updatedEvent = await prisma.event.update({
    where: { id: event1.id },
    data: { name: updatedName },
  });
  assert(updatedEvent.name === updatedName, "Event details successfully updated in database");

  // -------------------------------------------------------------------------
  // Test 4: Lifecycle State Machine Transitions
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Lifecycle state machine transition rules");
  assert(isAllowedTransition("DRAFT", "SCHEDULED") === true, "DRAFT -> SCHEDULED permitted");
  assert(isAllowedTransition("DRAFT", "LIVE") === true, "DRAFT -> LIVE permitted");
  assert(isAllowedTransition("DRAFT", "FINALIZED") === false, "DRAFT -> FINALIZED strictly forbidden");
  assert(isAllowedTransition("DRAFT", "CLOSED") === false, "DRAFT -> CLOSED strictly forbidden");

  assert(isAllowedTransition("SCHEDULED", "LIVE") === true, "SCHEDULED -> LIVE permitted");
  assert(isAllowedTransition("SCHEDULED", "DRAFT") === true, "SCHEDULED -> DRAFT permitted");
  assert(isAllowedTransition("SCHEDULED", "FINALIZED") === false, "SCHEDULED -> FINALIZED strictly forbidden");

  assert(isAllowedTransition("LIVE", "CLOSED") === true, "LIVE -> CLOSED permitted");
  assert(isAllowedTransition("LIVE", "DRAFT") === false, "LIVE -> DRAFT forbidden");

  assert(isAllowedTransition("CLOSED", "FINALIZED") === true, "CLOSED -> FINALIZED permitted");
  assert(isAllowedTransition("CLOSED", "LIVE") === true, "CLOSED -> LIVE (reopen) permitted");

  assert(isAllowedTransition("FINALIZED", "ARCHIVED") === true, "FINALIZED -> ARCHIVED permitted");
  assert(isAllowedTransition("FINALIZED", "LIVE") === false, "FINALIZED -> LIVE forbidden");

  // Update event status in DB according to state machine
  const scheduled = await prisma.event.update({
    where: { id: event1.id },
    data: { status: "SCHEDULED" },
  });
  assert(scheduled.status === "SCHEDULED", "Event status transitioned to SCHEDULED");

  const live = await prisma.event.update({
    where: { id: event1.id },
    data: { status: "LIVE" },
  });
  assert(live.status === "LIVE", "Event status transitioned to LIVE");

  // -------------------------------------------------------------------------
  // Test 5: Organizer Ownership and Multi-Tenant Isolation
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Organizer ownership & multi-tenant isolation");
  // Org1 owns event1
  assert(event1.organizerId === org1.id, "Event is owned by Organizer 1");
  assert(event1.organizerId !== org2.id, "Event is NOT owned by Organizer 2");

  // Query events for Org 2
  const org2Events = await prisma.event.findMany({
    where: { organizerId: org2.id },
  });
  assert(org2Events.length === 0, "Organizer 2 has zero events; cannot see Organizer 1's events");

  // -------------------------------------------------------------------------
  // Test 6: Public Access to Published vs Draft Events
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Public access to published vs draft events");
  // Create a Draft event for Org 2
  const draftEvent = await prisma.event.create({
    data: {
      name: "Private Internal Gala",
      slug: "private-internal-gala",
      description: "Internal company ceremony not yet ready for public view.",
      startDate,
      endDate,
      votingStartsAt: vStarts,
      votingEndsAt: vEnds,
      organizerId: org2.id,
      status: "DRAFT",
    },
  });

  assert(isPubliclyVisibleStatus(draftEvent.status) === false, "DRAFT event is strictly not publicly visible");
  assert(isPubliclyVisibleStatus("SCHEDULED") === true, "SCHEDULED event is publicly visible");
  assert(isPubliclyVisibleStatus("LIVE") === true, "LIVE event is publicly visible");
  assert(isPubliclyVisibleStatus("CLOSED") === true, "CLOSED event is publicly visible");
  assert(isPubliclyVisibleStatus("FINALIZED") === true, "FINALIZED event is publicly visible");

  console.log("\n=======================================================");
  console.log(`Phase 3 Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
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
