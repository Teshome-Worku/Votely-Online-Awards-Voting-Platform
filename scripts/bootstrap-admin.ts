import { prisma } from "../src/lib/prisma";
import { hashPassword, normalizeEmail, validateRegistrationInput } from "../src/lib/auth";

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1] || process.env.BOOTSTRAP_ADMIN_EMAIL;
  const passwordArg = args.find((a) => a.startsWith("--password="))?.split("=")[1] || process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const nameArg = args.find((a) => a.startsWith("--name="))?.split("=")[1] || process.env.BOOTSTRAP_ADMIN_NAME || "Platform Administrator";

  if (!emailArg || !passwordArg) {
    console.error("Usage: npx tsx scripts/bootstrap-admin.ts --email=admin@example.com --password=SecurePassword123 [--name='Admin Name']");
    console.error("Or define BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD environment variables.");
    process.exit(1);
  }

  const email = normalizeEmail(emailArg);
  const validation = validateRegistrationInput({
    name: nameArg,
    email,
    password: passwordArg,
  });

  if (!validation.isValid) {
    console.error("Validation error:", validation.errors);
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        role: "PLATFORM_ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true, status: true },
    });
    console.log(`Successfully elevated existing user '${updated.email}' (ID: ${updated.id}) to role: ${updated.role}`);
  } else {
    const passwordHash = await hashPassword(passwordArg);
    const created = await prisma.user.create({
      data: {
        name: nameArg,
        email,
        passwordHash,
        role: "PLATFORM_ADMIN",
        status: "ACTIVE",
      },
      select: { id: true, email: true, role: true, status: true },
    });
    console.log(`Successfully created new platform administrator account '${created.email}' (ID: ${created.id}) with role: ${created.role}`);
  }
}

main()
  .catch((err) => {
    console.error("Bootstrap error:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
