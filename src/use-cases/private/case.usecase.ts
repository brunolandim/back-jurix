import {
  CaseRepository,
  ColumnRepository,
  LawyerRepository,
} from '../../db/repository';
import { NotFoundError, ConflictError } from '../../errors';
import type {
  LegalCase,
  LegalCaseWithAssignee,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
  MoveCaseInput,
  AuthContext,
} from '../../types';
import { toPublicLawyer } from '../../types';

export class CaseUseCase {
  private caseRepo: CaseRepository;
  private columnRepo: ColumnRepository;
  private lawyerRepo: LawyerRepository;

  constructor() {
    this.caseRepo = new CaseRepository();
    this.columnRepo = new ColumnRepository();
    this.lawyerRepo = new LawyerRepository();
  }

  async list(organizationId: string): Promise<LegalCase[]> {
    return this.caseRepo.findByOrganization(organizationId);
  }

  async getById(id: string, organizationId: string): Promise<LegalCaseWithAssignee> {
    const legalCase = await this.caseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== organizationId) {
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
    input: Omit<CreateLegalCaseInput, 'createdBy' | 'order'>,
    context: AuthContext
  ): Promise<LegalCase> {
    const column = await this.columnRepo.findById(input.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Column', input.columnId);
    }

    const existing = await this.caseRepo.findByNumber(input.number);
    if (existing) {
      throw new ConflictError('Case number already exists', 'number');
    }

    if (input.assignedTo) {
      const assignee = await this.lawyerRepo.findById(input.assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', input.assignedTo);
      }
    }

    const maxOrder = await this.caseRepo.getMaxOrder(input.columnId);

    return this.caseRepo.create({
      ...input,
      createdBy: context.lawyerId,
      order: maxOrder + 1,
    });
  }

  async update(
    id: string,
    input: UpdateLegalCaseInput,
    context: AuthContext
  ): Promise<LegalCase> {
    const legalCase = await this.caseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', id);
    }

    if (input.columnId && input.columnId !== legalCase.columnId) {
      const newColumn = await this.columnRepo.findById(input.columnId);
      if (!newColumn || newColumn.organizationId !== context.organizationId) {
        throw new NotFoundError('Column', input.columnId);
      }
    }

    if (input.number && input.number !== legalCase.number) {
      const existing = await this.caseRepo.findByNumber(input.number);
      if (existing) {
        throw new ConflictError('Case number already exists', 'number');
      }
    }

    if (input.assignedTo) {
      const assignee = await this.lawyerRepo.findById(input.assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', input.assignedTo);
      }
    }

    const updated = await this.caseRepo.update(id, input);
    return updated!;
  }

  async move(id: string, input: MoveCaseInput, context: AuthContext): Promise<LegalCase> {
    const legalCase = await this.caseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', id);
    }

    const targetColumn = await this.columnRepo.findById(input.columnId);
    if (!targetColumn || targetColumn.organizationId !== context.organizationId) {
      throw new NotFoundError('Column', input.columnId);
    }

    const updated = await this.caseRepo.update(id, {
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
    const legalCase = await this.caseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', id);
    }

    if (assignedTo) {
      const assignee = await this.lawyerRepo.findById(assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', assignedTo);
      }
    }

    const updated = await this.caseRepo.update(id, { assignedTo });
    return updated!;
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const legalCase = await this.caseRepo.findById(id);

    if (!legalCase) {
      throw new NotFoundError('Case', id);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', id);
    }

    await this.caseRepo.delete(id);
  }
}
