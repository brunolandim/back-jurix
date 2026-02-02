import { NotFoundError, ForbiddenError } from '../../errors';
import type {
  INotificationRepository,
  ICaseRepository,
} from '../../db/interfaces';
import type {
  CaseNotification,
  CreateNotificationInput,
  AuthContext,
} from '../../types';

export class NotificationUseCase {
  constructor(
    private notificationRepo: INotificationRepository,
    private caseRepo: ICaseRepository
  ) {}

  async listByLawyer(context: AuthContext): Promise<CaseNotification[]> {
    return this.notificationRepo.findByLawyer(context.lawyerId);
  }

  async create(
    caseId: string,
    input: Omit<CreateNotificationInput, 'caseId'>,
    context: AuthContext
  ): Promise<CaseNotification> {
    const legalCase = await this.caseRepo.findById(caseId);
    if (!legalCase || legalCase.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', caseId);
    }

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

    const legalCase = await this.caseRepo.findById(notification.caseId);
    if (!legalCase || legalCase.organizationId !== context.organizationId) {
      throw new NotFoundError('Case', notification.caseId);
    }

    await this.notificationRepo.delete(id);
  }
}
