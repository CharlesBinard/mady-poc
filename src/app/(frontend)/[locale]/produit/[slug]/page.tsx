import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { ProductView } from '@/components/product/ProductView';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/container';
import { type AppLocale, isAppLocale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { breadcrumbSchema, productSchema } from '@/lib/schema-org';
import { buildAlternates, siteUrl } from '@/lib/seo';
import type { Product } from '@/payload-types';

export const revalidate = 3600;

interface ProductPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getProduct(locale: AppLocale, slug: string): Promise<Product | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return {};
  const product = await getProduct(locale, slug);
  if (!product) return {};
  const meta = product.meta;
  return {
    title: (meta && typeof meta.title === 'string' ? meta.title : product.title) ?? product.title,
    description:
      (meta && typeof meta.description === 'string' ? meta.description : undefined) ??
      product.shortDescription ??
      undefined,
    alternates: buildAlternates(locale, `/produit/${slug}`),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const product = await getProduct(locale, slug);
  if (!product) notFound();

  const t = await getTranslations('common');
  const category =
    product.category && typeof product.category === 'object' ? product.category : null;

  const crumbs = [
    { label: t('home'), href: `/${locale}` },
    ...(category
      ? [
          {
            label: category.title,
            href: `/${locale}/categorie-produit/${category.slug ?? ''}`,
          },
        ]
      : []),
    { label: product.title },
  ];

  const base = siteUrl();
  const jsonLd = [
    productSchema(product, locale),
    breadcrumbSchema(
      crumbs.map((c) => ({
        name: c.label,
        url: c.href ? `${base}${c.href}` : undefined,
      })),
    ),
  ];

  return (
    <div className="bg-background">
      <JsonLd data={jsonLd} />
      <Container className="pt-8">
        <Breadcrumbs items={crumbs} />
      </Container>
      <ProductView product={product} locale={locale} />
    </div>
  );
}
