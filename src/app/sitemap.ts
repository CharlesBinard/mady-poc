import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { siteUrl } from '@/lib/seo';

function buildAlternates(path: string): Record<string, string> {
  const base = siteUrl();
  return Object.fromEntries(
    routing.locales.map((l) => [l, `${base}/${l}${path === '' || path === '/' ? '' : path}`]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  try {
    const payload = await getPayloadClient();
    const [pages, products, categories] = await Promise.all([
      payload.find({ collection: 'pages', limit: 1000, locale: 'all' }),
      payload.find({ collection: 'products', limit: 1000, locale: 'all' }),
      payload.find({ collection: 'categories', limit: 1000, locale: 'all' }),
    ]);

    const entries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
      url: `${base}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: buildAlternates('') },
    }));

    for (const page of pages.docs) {
      if (!page.slug || page.slug === 'home') continue;
      entries.push({
        url: `${base}/${routing.defaultLocale}/${page.slug}`,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: { languages: buildAlternates(`/${page.slug}`) },
      });
    }

    for (const category of categories.docs) {
      if (!category.slug) continue;
      entries.push({
        url: `${base}/${routing.defaultLocale}/categorie-produit/${category.slug}`,
        lastModified: category.updatedAt ? new Date(category.updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: buildAlternates(`/categorie-produit/${category.slug}`),
        },
      });
    }

    for (const product of products.docs) {
      if (!product.slug) continue;
      entries.push({
        url: `${base}/${routing.defaultLocale}/produit/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: buildAlternates(`/produit/${product.slug}`) },
      });
    }

    return entries;
  } catch (err) {
    console.error('[sitemap] build failed', err);
    return routing.locales.map((locale) => ({
      url: `${base}/${locale}`,
      lastModified: now,
    }));
  }
}
