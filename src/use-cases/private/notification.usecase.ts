import { NotificationRepository, CaseRepository } from '../../db/repository';
import { NotFoundError, ForbiddenError } from '../../errors';
import type {
  CaseNotification,
  CreateNotificationInput,
  AuthContext,
} from '../../types';

export class NotificationUseCase {
  private notificationRepo: NotificationRepository;
  private caseRepo: CaseRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
    this.caseRepo = new CaseRepository();
  }

  async listByLawyer(context: AuthContext): Promise<CaseNotification[]> {
    return this.notificationRepo.findByLawyer(context.lawyerId);
  }

  async create(
    caseId: string,
    input: Omit<CreateNotificationInput, 'caseId'>,
    context: AuthContext
  ): Promise<CaseNotification> {
    const legalCase = await this.caseRepo.findById(caseId, context.organizationId);
    if (!legalCase) {
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

    const legalCase = await this.caseRepo.findById(notification.caseId, context.organizationId);
    if (!legalCase) {
      throw new NotFoundError('Case', notification.caseId);
    }

    await this.notificationRepo.delete(id);
  }
}
