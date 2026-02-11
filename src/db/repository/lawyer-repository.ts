import type { PrismaClient } from '../prisma';
import type { ILawyerRepository } from '../interfaces/ilawyer-repository';
import type {
  Lawyer,
  CreateLawyerInput,
  UpdateLawyerInput,
} from '../../types';
import { hashPassword } from '../../utils/password';

export class LawyerRepository implements ILawyerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Lawyer | null> {
    return this.prisma.lawyer.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Lawyer | null> {
    return this.prisma.lawyer.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByOab(oab: string): Promise<Lawyer | null> {
    return this.prisma.lawyer.findUnique({
      where: { oab: oab.toUpperCase() },
    });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.prisma.lawyer.count({
      where: { organizationId, active: true },
    });
  }

  async findByOrganization(organizationId: string, activeOnly = true): Promise<Lawyer[]> {
    return this.prisma.lawyer.findMany({
      where: {
        organizationId,
        ...(activeOnly && { active: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(input: CreateLawyerInput): Promise<Lawyer> {
    const passwordHash = await hashPassword(input.password);

    return this.prisma.lawyer.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone ?? null,
        oab: input.oab.toUpperCase(),
        specialty: input.specialty ?? null,
        role: input.role ?? 'lawyer',
      },
    });
  }

  async update(id: string, input: UpdateLawyerInput): Promise<Lawyer | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email.toLowerCase();
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.photo !== undefined) updateData.photo = input.photo;
    if (input.specialty !== undefined) updateData.specialty = input.specialty;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.avatarColor !== undefined) updateData.avatarColor = input.avatarColor;

    if (input.password) {
      updateData.passwordHash = await hashPassword(input.password);
    }

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.lawyer.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.lawyer.update({
      where: { id },
      data: { active: false },
    });

    return result !== null;
  }
}
