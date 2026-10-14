/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_ORG_DOCUMENT = '00000000000000';
const ADMIN_OAB = 'SUPERADMIN';

async function createSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    console.error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('SUPER_ADMIN_PASSWORD must have at least 8 characters');
    process.exit(1);
  }

  try {
    // Dedicated organization for the super admin (idempotent)
    const org = await prisma.organization.upsert({
      where: { document: ADMIN_ORG_DOCUMENT },
      update: {},
      create: {
        name: 'Kronolex Admin',
        document: ADMIN_ORG_DOCUMENT,
        email,
      },
    });

    const existingColumns = await prisma.column.findMany({
      where: { organizationId: org.id, isDefault: true },
    });
    const existingTitles = existingColumns.map((c) => c.title);

    if (!existingTitles.includes('new')) {
      await prisma.column.create({
        data: { organizationId: org.id, title: 'new', isDefault: true, order: 0 },
      });
    }
    if (!existingTitles.includes('completed')) {
      await prisma.column.create({
        data: { organizationId: org.id, title: 'completed', isDefault: true, order: 999 },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.lawyer.upsert({
      where: { email },
      update: { passwordHash, isSuperAdmin: true, role: 'owner', active: true },
      create: {
        organizationId: org.id,
        name,
        email,
        passwordHash,
        oab: ADMIN_OAB,
        role: 'owner',
        isSuperAdmin: true,
      },
    });

    console.log(`Super admin ready: ${email}`);
  } catch (err) {
    console.error('Failed to create super admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
