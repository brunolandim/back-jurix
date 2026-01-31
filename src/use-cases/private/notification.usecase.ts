import {
  NotificationRepository,
  CaseRepository,
  ColumnRepository,
} from '../../db/repository';
import { NotFoundError, ForbiddenError } from '../../errors';
import type {
  CaseNotification,
  CreateNotificationInput,
  AuthContext,
} from '../../types';

export class NotificationUseCase {
  private notificationRepo: NotificationRepository;
  private caseRepo: CaseRepository;
  private columnRepo: ColumnRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
    this.caseRepo = new CaseRepository();
    this.columnRepo = new ColumnRepository();
  }

  private async verifyCaseOwnership(caseId: string, organizationId: string): Promise<void> {
    const legalCase = await this.caseRepo.findById(caseId);
    if (!legalCase) {
      throw new NotFoundError('Case', caseId);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== organizationId) {
      throw new NotFoundError('Case', caseId);
    }
  }

  async listByLawyer(context: AuthContext): Promise<CaseNotification[]> {
    return this.notificationRepo.findByLawyer(context.lawyerId);
  }

  async create(
    caseId: string,
    input: Omit<CreateNotificationInput, 'caseId'>,
    context: AuthContext
  ): Promise<CaseNotification> {
    await this.verifyCaseOwnership(caseId, context.organizationId);

    return this.notificationRepo.create({
      caseId,
      lawyerId: input.lawyerId,
      type: input.type,
      message: input.message,
      date: input.date,
    });
  }

  async markAsRead(id: string, context: AuthContext): Promise<CaseNotification> {
    const notification = await this.notificationRepo.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    if (notification.lawyerId !== context.lawyerId) {
      throw new ForbiddenError('Cannot mark other lawyer notifications as read');
    }

    const updated = await this.notificationRepo.markAsRead(id);
    return updated!;
  }

  async markAllAsRead(context: AuthContext): Promise<number> {
    return this.notificationRepo.markAllAsRead(context.lawyerId);
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const notification = await this.notificationRepo.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification', id);
    }

    await this.verifyCaseOwnership(notification.caseId, context.organizationId);

    await this.notificationRepo.delete(id);
  }
}
