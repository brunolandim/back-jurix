import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(apiKey: string): Resend {
  if (resendClient) return resendClient;
  resendClient = new Resend(apiKey);
  return resendClient;
}

export async function sendEmailViaResend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
}): Promise<void> {
  const resend = getResendClient(params.apiKey);

  const { error } = await resend.emails.send({
    from: params.from,
    to: [params.to],
    subject: params.subject,
    html: params.htmlBody,
  });

  if (error) {
    throw new Error(`[resend] Failed to send email: ${error.message}`);
  }

  console.log(`[email-service] Email sent via Resend to ${params.to}`);
}
