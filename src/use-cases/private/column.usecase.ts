import { NotFoundError, ForbiddenError, ValidationError } from '../../errors';
import type {
  IColumnRepository,
  ICaseRepository,
} from '../../db/interfaces';
import type {
  Column,
  CreateColumnInput,
  UpdateColumnInput,
  LegalCase,
} from '../../types';
import { DocumentMapper } from '../../mappers/document.mapper';
import { LawyerMapper } from '../../mappers/lawyer.mapper';

export interface ColumnWithCases extends Column {
  cases: LegalCase[];
}

export class ColumnUseCase {
  constructor(
    private columnRepo: IColumnRepository,
    private caseRepo: ICaseRepository
  ) {}

  async list(organizationId: string): Promise<Column[]> {
    return this.columnRepo.findByOrganization(organizationId);
  }

  async listWithCases(organizationId: string): Promise<ColumnWithCases[]> {
    const columns = await this.columnRepo.findByOrganization(organizationId);

    const columnsWithCases: ColumnWithCases[] = [];

    for (const column of columns) {
      const cases = await this.caseRepo.findByColumn(column.id);
      const casesWithSignedUrls = await Promise.all(
        cases.map(async (c: any) => ({
          ...c,
          creator: c.creator ? { ...c.creator, photo: LawyerMapper.resolvePhoto(c.creator.photo) } : c.creator,
          assignee: c.assignee ? { ...c.assignee, photo: LawyerMapper.resolvePhoto(c.assignee.photo) } : c.assignee,
          documents: c.documents ? await Promise.all(c.documents.map((doc: any) => DocumentMapper.build(doc))) : c.documents,
        }))
      );
      columnsWithCases.push({ ...column, cases: casesWithSignedUrls });
    }

    return columnsWithCases;
  }

  async create(
    organizationId: string,
    input: Omit<CreateColumnInput, 'organizationId' | 'order'>
  ): Promise<Column> {
    const maxOrder = await this.columnRepo.getMaxOrder(organizationId);

    return this.columnRepo.create({
      organizationId,
      title: input.title,
      order: maxOrder + 1,
    });
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateColumnInput
  ): Promise<Column> {
    const column = await this.columnRepo.findById(id);

    if (!column || column.organizationId !== organizationId) {
      throw new NotFoundError('Column', id);
    }

    const updated = await this.columnRepo.update(id, input);
    return updated!;
  }

  async delete(id: string, organizationId: string): Promise<void> {
    const column = await this.columnRepo.findById(id);

    if (!column || column.organizationId !== organizationId) {
      throw new NotFoundError('Column', id);
    }

    if (column.isDefault) {
      throw new ForbiddenError('Cannot delete default column');
    }

    const hasCases = await this.columnRepo.hasCases(id);
    if (hasCases) {
      throw new ValidationError('Cannot delete column with cases. Move cases first.');
    }

    await this.columnRepo.delete(id);
  }
}
