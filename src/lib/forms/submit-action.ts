'use server';

import { headers } from 'next/headers';
import { sendEmail } from '@/lib/email';
import { getPayloadClient } from '@/lib/payload';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { buildZodSchema, type FormFieldBlock } from './schema';

export interface SubmitResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitForm(
  formId: number,
  rawData: Record<string, unknown>,
): Promise<SubmitResult> {
  const h = await headers();
  const ip = clientIp(h);
  if (!rateLimit(`form:${ip}`, 10, 10 * 60 * 1000)) {
    return { ok: false, message: 'Trop de tentatives. Réessayez plus tard.' };
  }

  const payload = await getPayloadClient();
  const form = await payload.findByID({ collection: 'forms', id: formId }).catch(() => null);
  if (!form) return { ok: false, message: 'Formulaire introuvable.' };

  const fields = (form.fields ?? []) as FormFieldBlock[];
  const schema = buildZodSchema(fields);
  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, message: 'Erreurs de validation', fieldErrors };
  }

  const submissionData = Object.entries(parsed.data).map(([field, value]) => ({
    field,
    value: value == null ? '' : String(value),
  }));

  try {
    await payload.create({
      collection: 'form-submissions',
      data: {
        form: formId,
        submissionData,
      },
    });
  } catch (err) {
    console.error('[submitForm] Payload save failed', err);
    return { ok: false, message: 'Échec enregistrement. Merci de réessayer.' };
  }

  const summary = submissionData.map((e) => `${e.field}: ${e.value}`).join('\n');
  const formTitle = typeof form.title === 'string' ? form.title : `Formulaire #${formId}`;
  const senderEmail = typeof parsed.data.email === 'string' ? parsed.data.email : undefined;

  await sendEmail({
    subject: `[Mady] Nouveau message : ${formTitle}`,
    text: summary,
    html: `<h1>${formTitle}</h1><pre>${summary.replace(/</g, '&lt;')}</pre>`,
    ...(senderEmail ? { replyTo: senderEmail } : {}),
  });

  return { ok: true, message: 'Message envoyé avec succès.' };
}
