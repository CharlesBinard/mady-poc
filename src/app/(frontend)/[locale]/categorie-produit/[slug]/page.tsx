import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Container } from '@/components/ui/container';
import { type AppLocale, isAppLocale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { buildAlternates } from '@/lib/seo';
import type { Category, Product } from '@/payload-types';

export const revalidate = 3600;

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getCategoryWithProducts(
  locale: AppLocale,
  slug: string,
): Promise<{ category: Category; products: Product[] } | null> {
  const payload = await getPayloadClient();
  const { docs: categoryDocs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 1,
  });
  const category = categoryDocs[0];
  if (!category) return null;

  const { docs: products } = await payload.find({
    collection: 'products',
    where: { category: { equals: category.id } },
    locale,
    limit: 24,
    depth: 1,
    sort: 'title',
  });
  return { category, products };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return {};
  const data = await getCategoryWithProducts(locale, slug);
  if (!data) return {};
  const { category } = data;
  return {
    title: category.title,
    description: category.description ?? undefined,
    alternates: buildAlternates(locale, `/categorie-produit/${slug}`),
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const data = await getCategoryWithProducts(locale, slug);
  if (!data) notFound();
  const { category, products } = data;

  const t = await getTranslations('common');
  const heroImage = typeof category.heroImage === 'object' ? category.heroImage : null;

  return (
    <div className="bg-background">
      <Container className="pt-8">
        <Breadcrumbs
          items={[{ label: t('home'), href: `/${locale}` }, { label: category.title }]}
        />
      </Container>
      <section className="relative border-border border-b bg-surface">
        {heroImage?.url ? (
          <Image
            src={heroImage.url}
            alt={heroImage.alt ?? category.title}
            fill
            priority
            className="object-cover opacity-20"
          />
        ) : null}
        <Container className="relative py-16 md:py-24">
          <h1 className="font-display font-semibold text-4xl text-brand-primary md:text-5xl">
            {category.title}
          </h1>
          {category.description ? (
            <p className="mt-4 max-w-2xl text-lg text-muted leading-relaxed">
              {category.description}
            </p>
          ) : null}
        </Container>
      </section>
      <Container className="py-12">
        {products.length === 0 ? (
          <p className="text-muted">Aucun produit dans cette catégorie pour l'instant.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const galleryEntry = product.gallery?.[0];
              const media =
                galleryEntry && typeof galleryEntry.image === 'object' ? galleryEntry.image : null;
              return (
                <li key={product.id}>
                  <Link
                    href={`/${locale}/produit/${product.slug}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                      {media?.url ? (
                        <Image
                          src={media.url}
                          alt={media.alt ?? product.title}
                          fill
                          loading="lazy"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      <h2 className="font-medium text-brand-primary text-lg">{product.title}</h2>
                      {product.shortDescription ? (
                        <p className="mt-2 line-clamp-2 text-muted text-sm">
                          {product.shortDescription}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </div>
  );
}
