import type { PrismaClient } from '../prisma';
import type { ICaseRepository } from '../interfaces/icase-repository';
import type {
  LegalCase,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
} from '../../types';

export class LegalCaseRepository implements ICaseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<LegalCase | null> {
    return this.prisma.legalCase.findFirst({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
      },
    });
  }

  async findByColumn(columnId: string) {
    return this.prisma.legalCase.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
        notifications: true,
        documents: true,
      },
    });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.prisma.legalCase.count({
      where: { organizationId, active: true },
    });
  }

  async findByOrganization(organizationId: string): Promise<LegalCase[]> {
    return this.prisma.legalCase.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByAssignee(lawyerId: string): Promise<LegalCase[]> {
    return this.prisma.legalCase.findMany({
      where: { assignedTo: lawyerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: CreateLegalCaseInput): Promise<LegalCase> {
    return this.prisma.legalCase.create({
      data: {
        organizationId: input.organizationId,
        columnId: input.columnId,
        number: input.number,
        title: input.title,
        description: input.description ?? null,
        client: input.client,
        clientPhone: input.clientPhone ?? null,
        priority: input.priority ?? 'medium',
        order: input.order,
        assignedTo: input.assignedTo ?? null,
        createdBy: input.createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
      },
    });
  }

  async update(id: string, input: UpdateLegalCaseInput): Promise<LegalCase | null> {
    const updateData: Record<string, unknown> = {};

    if (input.columnId !== undefined) updateData.columnId = input.columnId;
    if (input.number !== undefined) updateData.number = input.number;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.client !== undefined) updateData.client = input.client;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.order !== undefined) updateData.order = input.order;
    if (input.active !== undefined) updateData.active = input.active;
    if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.legalCase.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            photo: true,
            oab: true,
            avatarColor:true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.legalCase.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getMaxOrder(columnId: string): Promise<number> {
    const result = await this.prisma.legalCase.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    return result._max.order ?? 0;
  }
}
