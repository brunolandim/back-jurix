import type { INotificationRepository } from '../../db/interfaces/inotification-repository';
import { sendNotificationEmail } from '../../services/email-service';

export interface ProcessResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ notificationId: string; error: string }>;
}

export class NotificationSenderUseCase {
  constructor(
    private notificationRepo: INotificationRepository,
  ) {}

  async execute(): Promise<ProcessResult> {
    const result: ProcessResult = { total: 0, sent: 0, failed: 0, errors: [] };

    const notifications = await this.notificationRepo.findPendingToSend();
    result.total = notifications.length;

    if (notifications.length === 0) {
      return result;
    }

    for (const notification of notifications) {
      try {
        if (!notification.lawyer) {
          console.warn(`[notification-sender] Notification ${notification.id} has no lawyer, skipping`);
          result.failed++;
          result.errors.push({ notificationId: notification.id, error: 'No lawyer assigned' });
          continue;
        }

        await sendNotificationEmail(notification);

        await this.notificationRepo.markAsSent(notification.id);
        result.sent++;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[notification-sender] Failed to send notification ${notification.id}: ${errMsg}`);
        result.failed++;
        result.errors.push({ notificationId: notification.id, error: errMsg });
      }
    }

    return result;
  }
}
