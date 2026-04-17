import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
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
import { articleSchema, breadcrumbSchema } from '@/lib/schema-org';
import { buildAlternates, siteUrl } from '@/lib/seo';
import type { Post } from '@/payload-types';

export const revalidate = 3600;

interface BlogPostProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getPost(locale: AppLocale, slug: string): Promise<Post | null> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    depth: 2,
  });
  return docs[0] ?? null;
}

async function getRelatedPosts(
  locale: AppLocale,
  currentId: number,
  categoryId: number | null,
): Promise<Post[]> {
  const payload = await getPayloadClient();
  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    limit: 3,
    depth: 1,
    sort: '-publishedAt',
    where: {
      id: { not_equals: currentId },
      ...(categoryId ? { category: { equals: categoryId } } : {}),
    },
  });
  return docs;
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) return {};
  const post = await getPost(locale, slug);
  if (!post) return {};
  const cover = typeof post.coverImage === 'object' ? post.coverImage : null;
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: buildAlternates(locale, `/blog/${slug}`),
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: cover?.url ? [{ url: cover.url }] : undefined,
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

export default async function BlogPost({ params }: BlogPostProps) {
  const { locale, slug } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  const post = await getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations('blog');
  const tc = await getTranslations('common');

  const cover = typeof post.coverImage === 'object' ? post.coverImage : null;
  const category = post.category && typeof post.category === 'object' ? post.category : null;

  const contentHtml = post.content
    ? convertLexicalToHTML({
        data: post.content as unknown as Parameters<typeof convertLexicalToHTML>[0]['data'],
      })
    : '';

  const related = await getRelatedPosts(locale, post.id, category?.id ?? null);

  const base = siteUrl();
  const jsonLd = [
    articleSchema(post, locale),
    breadcrumbSchema([
      { name: tc('home'), url: `${base}/${locale}` },
      { name: t('title'), url: `${base}/${locale}/blog` },
      { name: post.title },
    ]),
  ];

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <article className="bg-background">
      <JsonLd data={jsonLd} />
      <Container className="pt-8">
        <Breadcrumbs
          items={[
            { label: tc('home'), href: `/${locale}` },
            { label: t('title'), href: `/${locale}/blog` },
            { label: post.title },
          ]}
        />
      </Container>

      <header className="border-border border-b bg-surface">
        <Container className="py-12 md:py-16">
          {category ? (
            <Link
              href={`/${locale}/blog?category=${category.slug}`}
              className="font-semibold text-brand-accent text-sm uppercase tracking-widest hover:underline"
            >
              {category.title}
            </Link>
          ) : null}
          <h1 className="mt-4 max-w-4xl font-display font-semibold text-4xl text-brand-primary leading-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-muted text-sm">
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {t('publishedOn', {
                  date: dateFormatter.format(new Date(post.publishedAt)),
                })}
              </time>
            ) : null}
            {post.readingMinutes ? (
              <>
                <span aria-hidden="true">•</span>
                <span>{t('readingTime', { minutes: post.readingMinutes })}</span>
              </>
            ) : null}
          </div>
        </Container>
      </header>

      {cover?.url ? (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface">
          <Image
            src={cover.url}
            alt={cover.alt ?? post.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <Container className="py-12 md:py-16">
        {post.excerpt ? (
          <p className="mb-10 max-w-3xl text-lg text-muted leading-relaxed">{post.excerpt}</p>
        ) : null}
        <div
          className="prose prose-lg max-w-3xl text-brand-primary prose-headings:font-display prose-headings:font-semibold prose-headings:text-brand-primary prose-a:text-brand-accent prose-strong:text-brand-primary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: post content from Payload Lexical renderer, sanitized upstream
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="mt-12 border-border border-t pt-8">
          <Link href={`/${locale}/blog`} className="text-brand-primary text-sm hover:underline">
            ← {t('backToBlog')}
          </Link>
        </div>
      </Container>

      {related.length > 0 ? (
        <section className="border-border border-t bg-surface">
          <Container className="py-12 md:py-16">
            <h2 className="font-display font-semibold text-2xl text-brand-primary md:text-3xl">
              {t('relatedPosts')}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((p) => {
                const rCover = typeof p.coverImage === 'object' ? p.coverImage : null;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/${locale}/blog/${p.slug}`}
                      className="group block overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-lg"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-surface">
                        {rCover?.url ? (
                          <Image
                            src={rCover.url}
                            alt={rCover.alt ?? p.title}
                            fill
                            loading="lazy"
                            sizes="(min-width: 768px) 33vw, 100vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <div className="p-5">
                        <h3 className="line-clamp-2 font-display font-medium text-brand-primary leading-tight">
                          {p.title}
                        </h3>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      ) : null}
    </article>
  );
}
