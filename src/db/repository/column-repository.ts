import type { PrismaClient } from '../prisma';
import type { IColumnRepository } from '../interfaces/icolumn-repository';
import type {
  Column,
  CreateColumnInput,
  UpdateColumnInput,
} from '../../types';

export class ColumnRepository implements IColumnRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Column | null> {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async findByOrganization(organizationId: string): Promise<Column[]> {
    return this.prisma.column.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
    });
  }

  async create(input: CreateColumnInput): Promise<Column> {
    return this.prisma.column.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        isDefault: input.isDefault ?? false,
        order: input.order,
      },
    });
  }

  async createMany(inputs: CreateColumnInput[]): Promise<Column[]> {
    if (inputs.length === 0) return [];

    const columns: Column[] = [];

    for (const input of inputs) {
      const column = await this.create(input);
      columns.push(column);
    }

    return columns;
  }

  async update(id: string, input: UpdateColumnInput): Promise<Column | null> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.order !== undefined) updateData.order = input.order;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.column.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.column.delete({
        where: {
          id,
          isDefault: false,
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getMaxOrder(organizationId: string): Promise<number> {
    const result = await this.prisma.column.aggregate({
      where: { organizationId, isDefault: false },
      _max: { order: true },
    });

    return result._max.order ?? 0;
  }

  async hasCases(columnId: string): Promise<boolean> {
    const count = await this.prisma.legalCase.count({
      where: { columnId },
    });

    return count > 0;
  }
}
