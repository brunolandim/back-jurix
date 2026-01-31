import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Connected to database');

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: 'Escritório Demo',
        document: '00.000.000/0001-00',
        email: 'contato@demo.com.br',
      },
    });
    console.log('Created organization:', org.id);

    // Create default columns
    const columns = [
      { title: 'Novo', key: 'new', order: 0, isDefault: true },
      { title: 'Em Andamento', key: 'in_progress', order: 1, isDefault: false },
      { title: 'Concluído', key: 'completed', order: 2, isDefault: false },
    ];

    for (const col of columns) {
      await prisma.column.create({
        data: {
          organizationId: org.id,
          title: col.title,
          key: col.key,
          isDefault: col.isDefault,
          order: col.order,
        },
      });
    }
    console.log('Created default columns');

    // Create owner lawyer
    const passwordHash = await bcrypt.hash('admin123', 10);

    const lawyer = await prisma.lawyer.create({
      data: {
        organizationId: org.id,
        name: 'Administrador',
        email: 'admin@jurix.com',
        passwordHash,
        oab: 'ADM000000',
        role: 'owner',
      },
    });
    console.log('Created owner lawyer:', lawyer.id);

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
