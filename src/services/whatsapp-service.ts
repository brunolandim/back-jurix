import type { NotificationType } from '../enum';
import type { PendingNotification } from '../db/interfaces/inotification-repository';
import { getEnv } from '../config/env';

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  hearing: 'Audiência',
  deadline: 'Prazo',
  meeting: 'Reunião',
  task: 'Tarefa',
  other: 'Outro',
};

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Already has country code (55)
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Brazilian number without country code
  return `55${digits}`;
}

export async function sendWhatsAppNotification(notification: PendingNotification): Promise<void> {
  const env = getEnv();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn('[whatsapp-service] WhatsApp not configured, skipping');
    return;
  }

  if (!notification.lawyer?.phone) {
    console.warn(`[whatsapp-service] Notification ${notification.id}: lawyer has no phone, skipping`);
    return;
  }

  const phone = normalizePhone(notification.lawyer.phone);
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] ?? 'Notificação';
  const caseInfo = `${notification.case.title} - ${notification.case.number}`;
  const message = notification.message ?? '';

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'case_notification',
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: typeLabel },
              { type: 'text', text: caseInfo },
              { type: 'text', text: message || '-' },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${body}`);
  }
}
