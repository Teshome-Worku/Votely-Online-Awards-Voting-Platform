import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany();
  console.log("Current Users count:", users.length);
  for (const u of users) {
    console.log(`- User: ${u.id} | ${u.name} | ${u.email} | ${u.role} | org: ${u.organization}`);
  }

  const events = await prisma.event.findMany({
    include: {
      categories: {
        include: {
          nominees: true,
        },
      },
    },
  });
  console.log("Current Events count:", events.length);
  for (const e of events) {
    console.log(`- Event: ${e.id} | ${e.name} | ${e.slug} | status: ${e.status}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
