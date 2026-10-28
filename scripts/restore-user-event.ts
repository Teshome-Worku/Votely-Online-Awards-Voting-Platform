import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("Restoring user accounts, event, categories, and nominees...");

  const defaultPasswordHash = await hashPassword("Password123");

  // 1. Platform Admin: Kenan Worku
  const admin = await prisma.user.upsert({
    where: { email: "kenanworku981@gmail.com" },
    update: {
      name: "Platform Admin-Kenan Worku",
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
    create: {
      name: "Platform Admin-Kenan Worku",
      email: "kenanworku981@gmail.com",
      passwordHash: defaultPasswordHash,
      role: "PLATFORM_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Admin user: ${admin.email} (ID: ${admin.id})`);

  // 2. Organizer: Morma Worku (Ozone Tech)
  const organizerMorma = await prisma.user.upsert({
    where: { email: "morma.worku@gmail.com" },
    update: {
      name: "Morma Worku",
      organization: "Ozone Tech",
      role: "ORGANIZER",
      status: "ACTIVE",
    },
    create: {
      name: "Morma Worku",
      email: "morma.worku@gmail.com",
      passwordHash: defaultPasswordHash,
      role: "ORGANIZER",
      organization: "Ozone Tech",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Organizer user: ${organizerMorma.name} / ${organizerMorma.email} (ID: ${organizerMorma.id})`);

  // 3. Organizer: Kenan Worku (Walin Technologies)
  const organizerKenan = await prisma.user.upsert({
    where: { email: "teshomeworku96@gmail.com" },
    update: {
      name: "Kenan Worku",
      organization: "Walin Technologies",
      role: "ORGANIZER",
      status: "ACTIVE",
    },
    create: {
      name: "Kenan Worku",
      email: "teshomeworku96@gmail.com",
      passwordHash: defaultPasswordHash,
      role: "ORGANIZER",
      organization: "Walin Technologies",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Organizer user: ${organizerKenan.name} / ${organizerKenan.email} (ID: ${organizerKenan.id})`);

  // 4. Exact Event: "LinkedIn change maker of the year 2027" (ID: cmvqk0w4d000as1kg8n3t49sv)
  const eventId = "cmvqk0w4d000as1kg8n3t49sv";
  const event = await prisma.event.upsert({
    where: { id: eventId },
    update: {
      name: "LinkedIn change maker of the year 2027",
      slug: "linkedin-change-maker-of-the-year-2027",
      description:
        "LinkedIn change maker of the year 2027 brought young,elder,and many tech leader from different sectors in to one",
      bannerUrl: "/uploads/img_1793097584294_78497496.jpg",
      logoUrl: "/uploads/img_1793097584437_3e6f50b8.jpg",
      startDate: new Date("2026-10-28T04:27:00.000Z"),
      endDate: new Date("2026-11-26T04:27:00.000Z"),
      votingStartsAt: new Date("2026-10-30T04:27:00.000Z"),
      votingEndsAt: new Date("2026-11-16T04:27:00.000Z"),
      status: "SCHEDULED",
      organizerId: organizerMorma.id,
    },
    create: {
      id: eventId,
      name: "LinkedIn change maker of the year 2027",
      slug: "linkedin-change-maker-of-the-year-2027",
      description:
        "LinkedIn change maker of the year 2027 brought young,elder,and many tech leader from different sectors in to one",
      bannerUrl: "/uploads/img_1793097584294_78497496.jpg",
      logoUrl: "/uploads/img_1793097584437_3e6f50b8.jpg",
      startDate: new Date("2026-10-28T04:27:00.000Z"),
      endDate: new Date("2026-11-26T04:27:00.000Z"),
      votingStartsAt: new Date("2026-10-30T04:27:00.000Z"),
      votingEndsAt: new Date("2026-11-16T04:27:00.000Z"),
      status: "SCHEDULED",
      organizerId: organizerMorma.id,
    },
  });
  console.log(`✓ Event restored: "${event.name}" (ID: ${event.id}, Slug: ${event.slug})`);

  // 5. Restore Categories & Nominees matching the uploaded images
  // Category 1: Tech Leadership & Innovation
  const cat1 = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Tech Leadership & Innovation",
      description: "Recognizing leaders driving transformational technology initiatives across Ethiopia and beyond.",
      displayOrder: 1,
      nominees: {
        create: [
          {
            eventId: event.id,
            name: "Morma Worku",
            description: "Pioneering technological leader bridging industry ecosystems and empowering youth.",
            imageUrl: "/uploads/img_1793170343119_7799f7bc.jpg",
            displayOrder: 1,
          },
          {
            eventId: event.id,
            name: "Nominee - Tech Leader",
            description: "Driving breakthrough engineering solutions and cross-sector digital collaboration.",
            imageUrl: "/uploads/img_1793170663369_6f746e29.jpg",
            displayOrder: 2,
          },
          {
            eventId: event.id,
            name: "Nominee - Emerging Visionary",
            description: "Transforming digital services and spearheading community tech initiatives.",
            imageUrl: "/uploads/img_1793170807556_37ca1c6e.jpg",
            displayOrder: 3,
          },
        ],
      },
    },
    include: { nominees: true },
  });
  console.log(`✓ Category 1 created: "${cat1.name}" with ${cat1.nominees.length} nominees.`);

  // Category 2: Community Impact & Change Maker
  const cat2 = await prisma.category.create({
    data: {
      eventId: event.id,
      name: "Community Impact & Change Maker",
      description: "Honoring individuals fostering impactful community connections and inspiring change.",
      displayOrder: 2,
      nominees: {
        create: [
          {
            eventId: event.id,
            name: "Nominee - Community Champion",
            description: "Inspiring grassroots social transformation and active leadership across sectors.",
            imageUrl: "/uploads/img_1793170900426_40b2375d.jpg",
            displayOrder: 1,
          },
          {
            eventId: event.id,
            name: "Nominee - Youth Pioneer",
            description: "Bridging generations through education, youth mentorship, and creative technology.",
            imageUrl: "/uploads/img_1793171155903_acdc74d1.jpg",
            displayOrder: 2,
          },
        ],
      },
    },
    include: { nominees: true },
  });
  console.log(`✓ Category 2 created: "${cat2.name}" with ${cat2.nominees.length} nominees.`);

  console.log("\n=======================================================");
  console.log("   RESTORATION COMPLETE & VERIFIED");
  console.log("=======================================================");
  console.log(`Event URL: http://localhost:3000/events/${event.slug}`);
  console.log(`Manage URL: http://localhost:3000/dashboard/events/${event.id}`);
  console.log(`Login Accounts:`);
  console.log(`- Organizer (Morma): morma.worku@gmail.com / Password123`);
  console.log(`- Organizer (Kenan): teshomeworku96@gmail.com / Password123`);
  console.log(`- Platform Admin: kenanworku981@gmail.com / Password123`);
}

main()
  .catch((e) => {
    console.error("Restoration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
