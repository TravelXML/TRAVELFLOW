import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@travelflow.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Demo user already exists: ${email} / demo1234`);
    return;
  }

  const password = await bcrypt.hash("demo1234", 10);
  await prisma.user.create({
    data: {
      email,
      password,
      name: "Demo Agent",
      brandingAgencyName: "Demo Travel Co.",
      bookingComAffiliateId: "demo-booking-aid",
      getYourGuideAffiliateId: "demo-gyg-partner",
      skyscannerAffiliateId: "demo-skyscanner-aid",
    },
  });

  console.log(`Seeded demo user: ${email} / demo1234`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
