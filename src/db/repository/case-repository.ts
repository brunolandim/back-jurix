import { getPrisma } from '../prisma';
import type { ICaseRepository } from '../interfaces/icase-repository';
import type {
  LegalCase,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
} from '../../types';

export class CaseRepository implements ICaseRepository {
  async findById(id: string): Promise<LegalCase | null> {
    return getPrisma().legalCase.findUnique({ where: { id } });
  }

  async findByNumber(number: string): Promise<LegalCase | null> {
    return getPrisma().legalCase.findUnique({ where: { number } });
  }

  async findByColumn(columnId: string): Promise<LegalCase[]> {
    return getPrisma().legalCase.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });
  }

  async findByOrganization(organizationId: string): Promise<LegalCase[]> {
    return getPrisma().legalCase.findMany({
      where: {
        column: { organizationId },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByAssignee(lawyerId: string): Promise<LegalCase[]> {
    return getPrisma().legalCase.findMany({
      where: { assignedTo: lawyerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: CreateLegalCaseInput): Promise<LegalCase> {
    return getPrisma().legalCase.create({
      data: {
        columnId: input.columnId,
        number: input.number,
        title: input.title,
        description: input.description ?? null,
        client: input.client,
        priority: input.priority ?? 'medium',
        order: input.order,
        assignedTo: input.assignedTo ?? null,
        createdBy: input.createdBy,
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
    if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return getPrisma().legalCase.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await getPrisma().legalCase.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async getMaxOrder(columnId: string): Promise<number> {
    const result = await getPrisma().legalCase.aggregate({
      where: { columnId },
      _max: { order: true },
    });

    return result._max.order ?? 0;
  }
}
