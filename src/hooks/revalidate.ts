import type { CollectionAfterChangeHook } from 'payload';

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
  collection,
  context,
  operation,
}) => {
  if (process.env.SKIP_REVALIDATE === 'true') return doc;
  if (context?.isAutosave) return doc;
  if (operation !== 'create' && operation !== 'update') return doc;

  const status =
    typeof doc === 'object' && doc && '_status' in doc
      ? (doc as { _status?: string })._status
      : null;
  if (status && status !== 'published') return doc;

  const secret = process.env.REVALIDATE_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!secret || !baseUrl) return doc;

  const slug =
    typeof doc === 'object' && doc && 'slug' in doc && typeof doc.slug === 'string'
      ? doc.slug
      : null;

  const body: { tag?: string; path?: string } = { tag: collection.slug };
  if (slug) {
    body.path =
      collection.slug === 'products'
        ? `/fr/produit/${slug}`
        : collection.slug === 'categories'
          ? `/fr/categorie-produit/${slug}`
          : `/fr/${slug}`;
  }

  try {
    await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.error('[revalidate-hook]', err);
  }

  return doc;
};
