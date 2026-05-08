import { envVars } from "../config/env";
import { prisma } from "../database/prisma";
import { auth } from "./auth";

async function main() {
  console.log(" Starting database seeding...");

  const adminEmail = envVars.ADMIN_EMAIL;
  const adminPassword = envVars.ADMIN_PASSWORD;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("⚠️ Admin user already exists. Skipping seeding.");
    return;
  }

  console.log("⏳ Creating admin user...");

  const newAdmin = await auth.api.signUpEmail({
    body: {
      name: "System Admin",
      email: adminEmail,
      password: adminPassword,
    },
  });

  if (!newAdmin || !newAdmin.user) {
    throw new Error("Failed to create admin user through Better Auth.");
  }

  await prisma.user.update({
    where: { id: newAdmin.user.id },
    data: {
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log("✅ Admin user seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
