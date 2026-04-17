import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { type AnyBlock, BlockRenderer } from '@/blocks/renderer';
import { type AppLocale, isAppLocale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 3600;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

async function getHome(locale: AppLocale) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    locale,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const home = await getHome(locale);
  const meta = home?.meta;
  const title = meta && typeof meta.title === 'string' ? meta.title : 'Mady';
  const description = meta && typeof meta.description === 'string' ? meta.description : undefined;
  return {
    title,
    description,
    alternates: buildAlternates(locale, '/'),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const home = await getHome(locale);
  if (!home) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display font-semibold text-3xl text-brand-primary">
            Bienvenue sur Mady
          </h1>
          <p className="mt-3 text-muted">
            Lance <code>pnpm seed</code> pour peupler le contenu.
          </p>
        </div>
      </section>
    );
  }

  const layout = (home.layout ?? []) as AnyBlock[];
  return <BlockRenderer blocks={layout} locale={locale} />;
}
