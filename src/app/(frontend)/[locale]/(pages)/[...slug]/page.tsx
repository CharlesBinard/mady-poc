import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { type AnyBlock, BlockRenderer } from '@/blocks/renderer';
import { type AppLocale, isAppLocale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 3600;

interface CmsPageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

async function getPage(locale: AppLocale, slug: string) {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
}

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return {};
  const last = slug[slug.length - 1] ?? '';
  const page = await getPage(locale, last);
  if (!page) return {};
  const meta = page.meta;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const path = slug.join('/');
  return {
    title: (meta && typeof meta.title === 'string' ? meta.title : page.title) ?? page.title,
    description: meta && typeof meta.description === 'string' ? meta.description : undefined,
    alternates: buildAlternates(locale, `/${path}`),
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const last = slug[slug.length - 1];
  if (!last) notFound();
  const page = await getPage(locale, last);
  if (!page) notFound();

  const layout = (page.layout ?? []) as AnyBlock[];
  return (
    <article>
      {page.hero?.title ? (
        <header className="bg-surface py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            {page.hero.eyebrow ? (
              <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
                {page.hero.eyebrow}
              </p>
            ) : null}
            <h1 className="mt-4 font-display font-semibold text-4xl text-brand-primary md:text-5xl">
              {page.hero.title}
            </h1>
            {page.hero.subtitle ? (
              <p className="mt-4 text-lg text-muted leading-relaxed">{page.hero.subtitle}</p>
            ) : null}
          </div>
        </header>
      ) : null}
      <BlockRenderer blocks={layout} locale={locale} />
    </article>
  );
}
