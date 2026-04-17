interface SendEmailInput {
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? 'Mady';
  const toEmail = process.env.BREVO_TO_EMAIL;

  if (!apiKey || !senderEmail || !toEmail) {
    console.warn('[email] Brevo not configured, logging only', input.subject);
    return { ok: true };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[email] Brevo error', res.status, text);
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (err) {
    console.error('[email] send failed', err);
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
