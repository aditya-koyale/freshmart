import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Creates the single Version-1 administrator account (SRS Part 7 §13:
 * admin creation must not be exposed through any public interface after
 * initial setup — this script is the only way to create one).
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=ChangeMe123 npm run db:seed
 */
async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const mobileNumber = process.env.ADMIN_MOBILE ?? '0000000000';

  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to seed the admin account.',
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists for ${email}, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      fullName: 'FreshMart Administrator',
      email,
      mobileNumber,
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin account created for ${email}`);

  // Seed sensible default settings (SRS Part 4 §20).
  const defaultSettings: Record<string, string> = {
    businessName: 'FreshMart',
    legalBusinessName: 'Aditya Fruit Supplier',
    currency: 'INR',
    timeZone: 'Asia/Kolkata',
    defaultDeliveryFee: '0',
    lowStockThresholdDefault: '10',
    stockReservationMinutes: '15',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log('✅ Default settings seeded');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
