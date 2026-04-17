import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { Container } from '@/components/ui/container';
import { type AppLocale, isAppLocale } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { blogSchema, breadcrumbSchema } from '@/lib/schema-org';
import { buildAlternates, siteUrl } from '@/lib/seo';
import type { Post, PostCategory } from '@/payload-types';

export const revalidate = 3600;

interface BlogIndexProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}

async function getPosts(
  locale: AppLocale,
  categorySlug?: string,
): Promise<{
  posts: Post[];
  categories: PostCategory[];
  activeCategory: PostCategory | null;
}> {
  const payload = await getPayloadClient();

  const { docs: categories } = await payload.find({
    collection: 'post-categories',
    locale,
    limit: 50,
    sort: 'title',
  });

  let categoryId: number | undefined;
  let activeCategory: PostCategory | null = null;
  if (categorySlug) {
    const found = categories.find((c) => c.slug === categorySlug);
    if (found) {
      categoryId = found.id;
      activeCategory = found;
    }
  }

  const { docs: posts } = await payload.find({
    collection: 'posts',
    locale,
    limit: 50,
    depth: 1,
    sort: '-publishedAt',
    ...(categoryId ? { where: { category: { equals: categoryId } } } : {}),
  });

  return { posts, categories, activeCategory };
}

export async function generateMetadata({ params }: BlogIndexProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: buildAlternates(locale, '/blog'),
  };
}

export default async function BlogIndex({ params, searchParams }: BlogIndexProps) {
  const { locale } = await params;
  const { category: categorySlug } = await searchParams;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const { posts, categories, activeCategory } = await getPosts(locale, categorySlug);
  const t = await getTranslations('blog');
  const tc = await getTranslations('common');

  const base = siteUrl();
  const jsonLd = [
    blogSchema(locale, posts),
    breadcrumbSchema([
      { name: tc('home'), url: `${base}/${locale}` },
      { name: t('title'), url: `${base}/${locale}/blog` },
    ]),
  ];

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-background">
      <JsonLd data={jsonLd} />
      <Container className="pt-8">
        <Breadcrumbs items={[{ label: tc('home'), href: `/${locale}` }, { label: t('title') }]} />
      </Container>
      <section className="border-border border-b bg-surface">
        <Container className="py-16 md:py-24">
          <h1 className="font-display font-semibold text-4xl text-brand-primary md:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted leading-relaxed">{t('subtitle')}</p>
        </Container>
      </section>
      <Container className="py-12">
        <nav aria-label="Categories" className="mb-10">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={`/${locale}/blog`}
                className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  !activeCategory
                    ? 'border-brand-primary bg-brand-primary text-white'
                    : 'border-border bg-background text-brand-primary hover:border-brand-primary'
                }`}
              >
                {t('allCategories')}
              </Link>
            </li>
            {categories.map((cat) => {
              const isActive = activeCategory?.id === cat.id;
              return (
                <li key={cat.id}>
                  <Link
                    href={`/${locale}/blog?category=${cat.slug}`}
                    className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'border-brand-primary bg-brand-primary text-white'
                        : 'border-border bg-background text-brand-primary hover:border-brand-primary'
                    }`}
                  >
                    {cat.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {posts.length === 0 ? (
          <p className="text-muted">{t('noPosts')}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const cover = typeof post.coverImage === 'object' ? post.coverImage : null;
              const category =
                post.category && typeof post.category === 'object' ? post.category : null;
              return (
                <li key={post.id}>
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-lg"
                  >
                    <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                      {cover?.url ? (
                        <Image
                          src={cover.url}
                          alt={cover.alt ?? post.title}
                          fill
                          loading="lazy"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="p-6">
                      {category ? (
                        <p className="font-semibold text-brand-accent text-xs uppercase tracking-widest">
                          {category.title}
                        </p>
                      ) : null}
                      <h2 className="mt-2 line-clamp-2 font-display font-medium text-brand-primary text-xl leading-tight">
                        {post.title}
                      </h2>
                      {post.excerpt ? (
                        <p className="mt-3 line-clamp-3 text-muted text-sm leading-relaxed">
                          {post.excerpt}
                        </p>
                      ) : null}
                      <div className="mt-4 flex items-center gap-3 text-muted text-xs">
                        {post.publishedAt ? (
                          <time dateTime={post.publishedAt}>
                            {dateFormatter.format(new Date(post.publishedAt))}
                          </time>
                        ) : null}
                        {post.readingMinutes ? (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>
                              {t('readingTime', {
                                minutes: post.readingMinutes,
                              })}
                            </span>
                          </>
                        ) : null}
                      </div>
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
