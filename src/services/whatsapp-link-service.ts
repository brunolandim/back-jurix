import { getEnv } from '../config/env';

export async function sendShareLinkWhatsApp(
  clientPhone: string,
  lawyerName: string,
  organizationName: string,
  linkToken: string
): Promise<void> {
  const env = getEnv();
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = env.WHATSAPP_ACCESS_TOKEN;
  const appUrl = env.APP_URL;

  if (!phoneNumberId || !accessToken) {
    console.warn('[whatsapp-link-service] WhatsApp not configured, skipping');
    return;
  }

  // Phone already comes with country code from frontend
  const phone = clientPhone.replace(/\D/g, '');
  const linkUrl = `${appUrl}/share/${linkToken}`;
  
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
        name: 'share_link',
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: lawyerName },
              { type: 'text', text: organizationName },
            ],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: linkToken }],
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`WhatsApp API error ${response.status}: ${body}`);
  }

  console.log(`[whatsapp-link-service] Link sent to ${phone}`);
}
