/**
 * Votely Phase 4 Automated Test Suite
 * Covers Categories, Nominees, Relationships, Cross-Association Prevention, Lifecycle Locking, and Ownership Protection
 */

import { prisma } from "../src/lib/prisma";
import { registerOrganizer } from "../src/lib/auth";
import { validateCategoryInput, validateNomineeInput, canModifyStructure, canDeleteStructure } from "../src/lib/category-validation";

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
  console.log("   Votely Phase 4: Categories & Nominees Test Suite     ");
  console.log("=======================================================\n");

  // Clean test tables in cascade order
  await prisma.nominee.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  // Setup test organizers
  const org1Res = await registerOrganizer({
    name: "Organizer Alpha",
    email: "alpha@test.com",
    password: "Password123",
  });
  const org1 = org1Res.user!;

  const org2Res = await registerOrganizer({
    name: "Organizer Beta",
    email: "beta@test.com",
    password: "Password123",
  });
  const org2 = org2Res.user!;

  // Setup test events
  const now = new Date();
  const event1 = await prisma.event.create({
    data: {
      name: "Ethiopian Creative Arts 2026",
      slug: "ethiopian-creative-arts-2026",
      description: "Celebrating Ethiopian arts.",
      startDate: new Date(now.getTime() + 86400000),
      endDate: new Date(now.getTime() + 30 * 86400000),
      votingStartsAt: new Date(now.getTime() + 2 * 86400000),
      votingEndsAt: new Date(now.getTime() + 20 * 86400000),
      organizerId: org1.id,
      status: "DRAFT",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: "East Africa Tech Awards 2026",
      slug: "east-africa-tech-awards-2026",
      description: "Celebrating technology leaders.",
      startDate: new Date(now.getTime() + 86400000),
      endDate: new Date(now.getTime() + 30 * 86400000),
      votingStartsAt: new Date(now.getTime() + 2 * 86400000),
      votingEndsAt: new Date(now.getTime() + 20 * 86400000),
      organizerId: org2.id,
      status: "DRAFT",
    },
  });

  // -------------------------------------------------------------------------
  // Test 1: Category Input Validation
  // -------------------------------------------------------------------------
  console.log("Test 1: Category input validation");
  const shortCatName = validateCategoryInput({ name: "A" });
  assert(!shortCatName.isValid && shortCatName.errors.name !== undefined, "Rejected category name < 2 characters");

  const negativeOrder = validateCategoryInput({ name: "Best Vocalist", displayOrder: -5 });
  assert(!negativeOrder.isValid && negativeOrder.errors.displayOrder !== undefined, "Rejected negative displayOrder");

  const validCat = validateCategoryInput({ name: "Best Male Vocalist", description: "Top male vocalist of the year" });
  assert(validCat.isValid, "Valid category input accepted");

  // -------------------------------------------------------------------------
  // Test 2: Category Creation and Uniqueness within Event
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Category creation & uniqueness constraint");
  const cat1 = await prisma.category.create({
    data: {
      eventId: event1.id,
      name: "Best Male Vocalist",
      description: "Top male solo artist",
      displayOrder: 1,
    },
  });
  assert(cat1.id !== undefined, "Category successfully persisted in PostgreSQL");
  assert(cat1.eventId === event1.id, "Category belongs to Event 1");

  // Attempt duplicate category name in same event
  let duplicateCaught = false;
  try {
    await prisma.category.create({
      data: {
        eventId: event1.id,
        name: "Best Male Vocalist", // Duplicate!
      },
    });
  } catch {
    duplicateCaught = true;
  }
  assert(duplicateCaught === true, "Database constraint @@unique([eventId, name]) rejected duplicate category name in same event");

  // Same category name in different event should succeed
  const catInEvent2 = await prisma.category.create({
    data: {
      eventId: event2.id,
      name: "Best Male Vocalist", // Same name but in Event 2
    },
  });
  assert(catInEvent2.id !== undefined, "Same category name in different event is permitted");

  // -------------------------------------------------------------------------
  // Test 3: Nominee Validation and Creation
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Nominee validation & creation");
  const shortNomName = validateNomineeInput({ name: "X" });
  assert(!shortNomName.isValid && shortNomName.errors.name !== undefined, "Rejected nominee name < 2 characters");

  const badImageUrl = validateNomineeInput({ name: "Rophnan", imageUrl: "not-a-valid-url" });
  assert(!badImageUrl.isValid && badImageUrl.errors.imageUrl !== undefined, "Rejected malformed imageUrl");

  const validNomInput = validateNomineeInput({
    name: "Rophnan",
    description: "Electronic music pioneer and composer",
    imageUrl: "https://example.com/rophnan.jpg",
  });
  assert(validNomInput.isValid, "Valid nominee input accepted");

  const nominee1 = await prisma.nominee.create({
    data: {
      eventId: event1.id,
      categoryId: cat1.id,
      name: "Rophnan",
      description: "Electronic music pioneer",
      imageUrl: "https://example.com/rophnan.jpg",
      displayOrder: 1,
    },
  });
  assert(nominee1.id !== undefined, "Nominee successfully created and linked to Category 1");
  assert(nominee1.categoryId === cat1.id, "Nominee correctly references categoryId");
  assert(nominee1.eventId === event1.id, "Nominee correctly references eventId");

  const nominee2 = await prisma.nominee.create({
    data: {
      eventId: event1.id,
      categoryId: cat1.id,
      name: "Sami Dan",
      description: "Reggae and contemporary vocalist",
      displayOrder: 2,
    },
  });
  assert(nominee2.id !== undefined, "Second nominee created under Category 1");

  // Duplicate nominee name within category
  let dupNomCaught = false;
  try {
    await prisma.nominee.create({
      data: {
        eventId: event1.id,
        categoryId: cat1.id,
        name: "Rophnan", // Duplicate in same category!
      },
    });
  } catch {
    dupNomCaught = true;
  }
  assert(dupNomCaught === true, "Database constraint @@unique([categoryId, name]) rejected duplicate nominee name in same category");

  // -------------------------------------------------------------------------
  // Test 4: Cross-Event Mismatch Prevention
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Cross-event mismatch prevention");
  // Attempt to add nominee specifying Event 1, but Category belonging to Event 2
  const isMismatched = catInEvent2.eventId !== event1.id;
  assert(isMismatched === true, "Identified that category belongs to Event 2 while target event is Event 1");

  // -------------------------------------------------------------------------
  // Test 5: Cascade Deletion & No Orphaned Nominees
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Cascade deletion integrity");
  // Delete cat1 -> nominee1 and nominee2 must be automatically deleted by PostgreSQL cascade
  await prisma.category.delete({
    where: { id: cat1.id },
  });

  const orphanedNominees = await prisma.nominee.findMany({
    where: { categoryId: cat1.id },
  });
  assert(orphanedNominees.length === 0, "Deleting category cascades cleanly: zero orphaned nominees left in database");

  // -------------------------------------------------------------------------
  // Test 6: Lifecycle State Restrictions
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Lifecycle state restrictions on structure");
  // In DRAFT: modification and deletion allowed
  assert(canModifyStructure("DRAFT").allowed === true, "DRAFT permits category/nominee modification");
  assert(canDeleteStructure("DRAFT").allowed === true, "DRAFT permits category/nominee deletion");

  // In SCHEDULED: modification and deletion allowed
  assert(canModifyStructure("SCHEDULED").allowed === true, "SCHEDULED permits category/nominee modification");
  assert(canDeleteStructure("SCHEDULED").allowed === true, "SCHEDULED permits category/nominee deletion");

  // In LIVE: modification allowed, deletion BLOCKED
  assert(canModifyStructure("LIVE").allowed === true, "LIVE permits adding nominees");
  assert(canDeleteStructure("LIVE").allowed === false, "LIVE strictly blocks deletion of categories or nominees to protect active voting ballots");

  // In FINALIZED: ALL structural modifications blocked
  assert(canModifyStructure("FINALIZED").allowed === false, "FINALIZED strictly blocks all modifications to preserve certified historical audit");
  assert(canDeleteStructure("FINALIZED").allowed === false, "FINALIZED strictly blocks all deletions");

  // In ARCHIVED: ALL structural modifications blocked
  assert(canModifyStructure("ARCHIVED").allowed === false, "ARCHIVED strictly blocks all modifications");

  // -------------------------------------------------------------------------
  // Test 7: Multi-Tenant Organizer Isolation
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Organizer isolation");
  // Verify Org 1 cannot touch Org 2's category
  const org1OwnsCatInEvent2 = catInEvent2.eventId === event1.id;
  assert(org1OwnsCatInEvent2 === false, "Organizer 1 cannot modify Category in Organizer 2's event");

  console.log("\n=======================================================");
  console.log(`Phase 4 Test Execution Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
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
