import type { PrismaClient } from '../prisma';
import type { IOrganizationRepository } from '../interfaces/iorganization-repository';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../../types';

export class OrganizationRepository implements IOrganizationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { id } });
  }

  async findByDocument(document: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { document } });
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    return this.prisma.organization.create({
      data: {
        name: input.name,
        document: input.document,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    });
  }

  async updateStripeCustomerId(id: string, stripeCustomerId: string): Promise<Organization | null> {
    return this.prisma.organization.update({
      where: { id },
      data: { stripeCustomerId },
    });
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.logo !== undefined) updateData.logo = input.logo;
    if (input.active !== undefined) updateData.active = input.active;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.organization.update({
      where: { id },
      data: updateData,
    });
  }
}
