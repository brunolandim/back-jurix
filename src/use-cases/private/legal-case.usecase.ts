import { NotFoundError } from '../../errors';
import type {
  ICaseRepository,
  IColumnRepository,
  ILawyerRepository,
} from '../../db/interfaces';
import type {
  LegalCase,
  LegalCaseWithAssignee,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
  MoveCaseInput,
  AuthContext,
} from '../../types';
import { toPublicLawyer } from '../../types';

export class LegalCaseUseCase {
  constructor(
    private legalCaseRepo: ICaseRepository,
    private columnRepo: IColumnRepository,
    private lawyerRepo: ILawyerRepository
  ) {}

  async list(organizationId: string): Promise<LegalCase[]> {
    return this.legalCaseRepo.findByOrganization(organizationId);
  }

  async getById(id: string): Promise<LegalCaseWithAssignee> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    let assignee = null;
    if (legalCase.assignedTo) {
      const lawyer = await this.lawyerRepo.findById(legalCase.assignedTo);
      if (lawyer) {
        assignee = toPublicLawyer(lawyer);
      }
    }

    return { ...legalCase, assignee };
  }

  async create(
    input: Omit<CreateLegalCaseInput, 'organizationId' | 'createdBy' | 'order'>,
    context: AuthContext
  ): Promise<LegalCase> {
    const column = await this.columnRepo.findById(input.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Column', input.columnId);
    }

    if (input.assignedTo) {
      const assignee = await this.lawyerRepo.findById(input.assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', input.assignedTo);
      }
    }

    const maxOrder = await this.legalCaseRepo.getMaxOrder(input.columnId);

    return this.legalCaseRepo.create({
      ...input,
      organizationId: context.organizationId,
      createdBy: context.lawyerId,
      order: maxOrder + 1,
    });
  }

  async update(
    id: string,
    input: UpdateLegalCaseInput,
    context: AuthContext
  ): Promise<LegalCase> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    if (input.columnId && input.columnId !== legalCase.columnId) {
      const newColumn = await this.columnRepo.findById(input.columnId);
      if (!newColumn || newColumn.organizationId !== context.organizationId) {
        throw new NotFoundError('Column', input.columnId);
      }
    }

    if (input.assignedTo) {
      const assignee = await this.lawyerRepo.findById(input.assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', input.assignedTo);
      }
    }

    const updated = await this.legalCaseRepo.update(id, input);
    return updated!;
  }

  async move(id: string, input: MoveCaseInput, context: AuthContext): Promise<LegalCase> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const targetColumn = await this.columnRepo.findById(input.columnId);
    if (!targetColumn || targetColumn.organizationId !== context.organizationId) {
      throw new NotFoundError('Column', input.columnId);
    }

    const updated = await this.legalCaseRepo.update(id, {
      columnId: input.columnId,
      order: input.order,
    });

    return updated!;
  }

  async assign(
    id: string,
    assignedTo: string | null,
    context: AuthContext
  ): Promise<LegalCase> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    if (assignedTo) {
      const assignee = await this.lawyerRepo.findById(assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', assignedTo);
      }
    }

    const updated = await this.legalCaseRepo.update(id, { assignedTo });
    return updated!;
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    await this.legalCaseRepo.delete(id);
  }
}
