import type { INotificationRepository } from '../../db/interfaces/inotification-repository';
import type { ISubscriptionRepository } from '../../db/interfaces/isubscription-repository';
import type { Subscription } from '../../types';
import { PLANS } from '../../config/constants';
import { sendNotificationEmail } from '../../services/email-service';
import { sendWhatsAppNotification } from '../../services/whatsapp-service';

export interface ProcessResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ notificationId: string; error: string }>;
}

export class NotificationSenderUseCase {
  constructor(
    private notificationRepo: INotificationRepository,
    private subscriptionRepo: ISubscriptionRepository
  ) {}

  async execute(): Promise<ProcessResult> {
    const result: ProcessResult = { total: 0, sent: 0, failed: 0, errors: [] };

    const notifications = await this.notificationRepo.findPendingToSend();
    result.total = notifications.length;

    if (notifications.length === 0) {
      return result;
    }

    const subscriptionCache = new Map<string, Subscription | null>();

    for (const notification of notifications) {
      try {
        if (!notification.lawyer) {
          console.warn(`[notification-sender] Notification ${notification.id} has no lawyer, skipping`);
          result.failed++;
          result.errors.push({ notificationId: notification.id, error: 'No lawyer assigned' });
          continue;
        }

        const orgId = notification.lawyer.organizationId;

        if (!subscriptionCache.has(orgId)) {
          subscriptionCache.set(orgId, await this.subscriptionRepo.findByOrganizationId(orgId));
        }
        const subscription = subscriptionCache.get(orgId) ?? null;
        const planDef = subscription?.plan ? PLANS[subscription.plan] : null;

        await sendNotificationEmail(notification);

        if (
          planDef?.features.whatsappNotifications &&
          notification.lawyer.phone
        ) {
          try {
            await sendWhatsAppNotification(notification);
          } catch (whatsappError) {
            const errMsg = whatsappError instanceof Error ? whatsappError.message : String(whatsappError);
            console.error(`[notification-sender] WhatsApp failed for ${notification.id}: ${errMsg}`);
          }
        }

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
