/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Connected to database');

    // Create organization (idempotent)
    const org = await prisma.organization.upsert({
      where: { document: '00.000.000/0001-00' },
      update: {},
      create: {
        name: 'Escritório Demo',
        document: '00.000.000/0001-00',
        email: 'contato@demo.com.br',
      },
    });
    console.log('Organization ready:', org.id);

    // Create default column (idempotent)
    const existingColumn = await prisma.column.findFirst({
      where: { organizationId: org.id, isDefault: true },
    });
    if (!existingColumn) {
      await prisma.column.create({
        data: {
          organizationId: org.id,
          title: 'new',
          isDefault: true,
          order: 0,
        },
      });
      console.log('Created default column');
    } else {
      console.log('Default column already exists');
    }

    // Create owner lawyer (idempotent)
    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.lawyer.upsert({
      where: { email: 'admin@jurix.com' },
      update: {},
      create: {
        organizationId: org.id,
        name: 'Administrador',
        email: 'admin@jurix.com',
        passwordHash,
        oab: 'ADM000000',
        role: 'owner',
        phone:'5561991311174'
      },
    });
    console.log('Owner lawyer ready');

    console.log('\n--- Seed completed ---');
    console.log('Login credentials:');
    console.log('  Email: admin@jurix.com');
    console.log('  Password: admin123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
