import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import type { NotificationType } from '../enum';
import type { PendingNotification } from '../db/interfaces/inotification-repository';
import { getEnv } from '../config/env';

let sesClient: SESClient | null = null;

function getSES(): SESClient {
  if (sesClient) return sesClient;
  const env = getEnv();
  sesClient = new SESClient({ region: env.SES_REGION ?? env.AWS_REGION });
  return sesClient;
}

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  hearing: 'Audiência',
  deadline: 'Prazo',
  meeting: 'Reunião',
  task: 'Tarefa',
  other: 'Outro',
};

const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  hearing: '#7c3aed',
  deadline: '#dc2626',
  meeting: '#2563eb',
  task: '#16a34a',
  other: '#6b7280',
};

function formatDatePtBR(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

export function buildNotificationEmail(notification: PendingNotification, appUrl: string): string {
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] ?? 'Notificação';
  const typeColor = NOTIFICATION_TYPE_COLORS[notification.type] ?? '#6b7280';
  const caseTitle = notification.case.title;
  const caseNumber = notification.case.number;
  const dateStr = formatDatePtBR(new Date(notification.date));

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#18181b;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Jurix</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <span style="display:inline-block;background:${typeColor};color:#ffffff;padding:4px 12px;border-radius:9999px;font-size:13px;font-weight:600;margin-bottom:16px;">
            ${typeLabel}
          </span>
          <h2 style="margin:16px 0 4px;color:#18181b;font-size:20px;">${caseTitle}</h2>
          <p style="margin:0 0 16px;color:#71717a;font-size:14px;">Processo ${caseNumber}</p>
          ${notification.message ? `<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">${notification.message}</p>` : ''}
          <p style="margin:0 0 24px;color:#71717a;font-size:14px;">${dateStr}</p>
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#18181b;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
            Abrir no Jurix
          </a>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;">
          <p style="margin:0;color:#a1a1aa;font-size:12px;text-align:center;">
            Jurix - Sistema de Gestão Jurídica
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<void> {
  const env = getEnv();
  const fromEmail = env.SES_FROM_EMAIL;

  if (!fromEmail) {
    console.warn('[email-service] SES_FROM_EMAIL not configured, skipping email');
    return;
  }

  const ses = getSES();

  await ses.send(
    new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: params.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: params.htmlBody, Charset: 'UTF-8' },
        },
      },
    })
  );
}

export async function sendNotificationEmail(notification: PendingNotification): Promise<void> {
  if (!notification.lawyer) {
    console.warn(`[email-service] Notification ${notification.id} has no lawyer, skipping`);
    return;
  }

  const env = getEnv();
  const typeLabel = NOTIFICATION_TYPE_LABELS[notification.type] ?? 'Notificação';
  const subject = `${typeLabel}: ${notification.case.title} - Processo ${notification.case.number}`;
  const htmlBody = buildNotificationEmail(notification, env.APP_URL);

  await sendEmail({
    to: notification.lawyer.email,
    subject,
    htmlBody,
  });
}
