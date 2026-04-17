import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { Container } from '@/components/ui/container';
import { isAppLocale } from '@/i18n/routing';
import type { FormFieldBlock } from '@/lib/forms/schema';
import { getPayloadClient } from '@/lib/payload';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 3600;

interface ContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  return {
    title: 'Contact',
    description: 'Demande de devis, questions techniques, SAV : contactez Mady.',
    alternates: buildAlternates(locale, '/contact'),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'forms',
    where: { title: { equals: 'Contact' } },
    limit: 1,
  });
  const form = docs[0];

  return (
    <Container className="py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-display font-semibold text-4xl text-brand-primary md:text-5xl">
          Contact
        </h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          Demande de devis, question technique ou SAV — nous répondons sous 24h ouvrées.
        </p>
      </header>
      {form ? (
        <FormRenderer
          formId={form.id}
          fields={(form.fields ?? []) as FormFieldBlock[]}
          {...(typeof form.confirmationMessage === 'string'
            ? { confirmationMessage: form.confirmationMessage }
            : {})}
          submitLabel={
            typeof form.submitButtonLabel === 'string' ? form.submitButtonLabel : 'Envoyer'
          }
        />
      ) : (
        <p className="text-muted">
          Formulaire Contact à créer dans l&apos;admin Payload (<code>/admin</code>).
        </p>
      )}
    </Container>
  );
}
