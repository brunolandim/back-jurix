import { NotFoundError, ValidationError } from '../../errors';
import type {
  ICaseRepository,
  IColumnRepository,
  ILawyerRepository,
  INotificationRepository,
} from '../../db/interfaces';
import type {
  LegalCase,
  LegalCaseWithAssignee,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
  MoveCaseInput,
  AuthContext,
} from '../../types';
import { LawyerMapper } from '../../mappers/lawyer.mapper';
import type { PlanEnforcerUseCase } from './plan-enforcer.usecase';

const COMPLETED_COLUMN = 'completed';

export class LegalCaseUseCase {
  constructor(
    private legalCaseRepo: ICaseRepository,
    private columnRepo: IColumnRepository,
    private lawyerRepo: ILawyerRepository,
    private planEnforcer: PlanEnforcerUseCase,
    private notificationRepo: INotificationRepository
  ) {}

  async list(organizationId: string): Promise<LegalCase[]> {
    return this.legalCaseRepo.findByOrganization(organizationId);
  }

  private async findOwned(id: string, organizationId: string): Promise<LegalCase> {
    const legalCase = await this.legalCaseRepo.findById(id);

    if (!legalCase || legalCase.organizationId !== organizationId) {
      throw new NotFoundError('Case', id);
    }

    return legalCase;
  }

  async getById(id: string, context: AuthContext): Promise<LegalCaseWithAssignee> {
    const legalCase = await this.findOwned(id, context.organizationId);

    let assignee = null;
    if (legalCase.assignedTo) {
      const lawyer = await this.lawyerRepo.findById(legalCase.assignedTo);
      if (lawyer) {
        assignee = LawyerMapper.toPublic(lawyer);
      }
    }

    return { ...legalCase, assignee };
  }

  async create(
    input: Omit<CreateLegalCaseInput, 'organizationId' | 'createdBy' | 'order'>,
    context: AuthContext
  ): Promise<LegalCase> {
    const column = await this.columnRepo.findById(input.columnId);
    if (!column) {
      throw new NotFoundError('Column', input.columnId);
    }
    if (column.organizationId !== context.organizationId) {
      throw new ValidationError('Column does not belong to your organization', undefined, 'errors.columnNotInOrg');
    }

    const active = column.title !== COMPLETED_COLUMN;
    if (active) {
      await this.planEnforcer.enforce(context, 'activeCases');
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
      active,
    });
  }

  async update(
    id: string,
    input: UpdateLegalCaseInput,
    context: AuthContext
  ): Promise<LegalCase> {
    const legalCase = await this.findOwned(id, context.organizationId);

    let active: boolean | undefined;
    if (input.columnId && input.columnId !== legalCase.columnId) {
      const newColumn = await this.columnRepo.findById(input.columnId);
      if (!newColumn || newColumn.organizationId !== context.organizationId) {
        throw new NotFoundError('Column', input.columnId);
      }

      active = newColumn.title !== COMPLETED_COLUMN;
      if (active && !legalCase.active) {
        await this.planEnforcer.enforce(context, 'activeCases');
      }
    }

    if (input.assignedTo) {
      const assignee = await this.lawyerRepo.findById(input.assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', input.assignedTo);
      }
    }

    const updated = await this.legalCaseRepo.update(id, active === undefined ? input : { ...input, active });

    if (input.assignedTo && input.assignedTo !== legalCase.assignedTo) {
      await this.notificationRepo.reassignPending(id, input.assignedTo);
    }

    return updated!;
  }

  async move(id: string, input: MoveCaseInput, context: AuthContext): Promise<LegalCase> {
    const legalCase = await this.findOwned(id, context.organizationId);

    const targetColumn = await this.columnRepo.findById(input.columnId);
    if (!targetColumn || targetColumn.organizationId !== context.organizationId) {
      throw new NotFoundError('Column', input.columnId);
    }

    const active = targetColumn.title !== COMPLETED_COLUMN;
    if (active && !legalCase.active) {
      await this.planEnforcer.enforce(context, 'activeCases');
    }

    const updated = await this.legalCaseRepo.update(id, {
      columnId: input.columnId,
      order: input.order,
      active,
    });

    return updated!;
  }

  async assign(
    id: string,
    assignedTo: string | null,
    context: AuthContext
  ): Promise<LegalCase> {
    const legalCase = await this.findOwned(id, context.organizationId);

    if (assignedTo) {
      const assignee = await this.lawyerRepo.findById(assignedTo);
      if (!assignee || assignee.organizationId !== context.organizationId) {
        throw new NotFoundError('Lawyer', assignedTo);
      }
    }

    const updated = await this.legalCaseRepo.update(id, { assignedTo });

    if (assignedTo) {
      await this.notificationRepo.reassignPending(id, assignedTo);
    }

    return updated!;
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const legalCase = await this.findOwned(id, context.organizationId);

    await this.legalCaseRepo.delete(id);
  }
}
