import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
process.env.SKIP_REVALIDATE = 'true';

import { getPayload } from 'payload';
import config from '../src/payload.config';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const ASSETS_DIR = path.join(dirname, 'assets');
const DATA_DIR = path.join(dirname, 'data');
const FALLBACK_IMAGE = path.resolve(dirname, '..', 'public', 'brand', 'logo-mady.png');

interface ScrapedCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface ScrapedProduct {
  slug: string;
  title: string;
  url: string;
  description: string;
  categorySlug: string | null;
  imageFiles: string[];
}

async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(DATA_DIR, file), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function inferCertifications(text: string): string[] {
  const certs: string[] = [];
  const t = text.toLowerCase();
  if (/nf\s*e85-?015|e85-?015/.test(t)) certs.push('nf-e85-015');
  if (/en\s*iso\s*14122|14122/.test(t)) certs.push('en-iso-14122');
  if (/nf\s*en\s*1090|en\s*1090/.test(t)) certs.push('nf-en-1090');
  certs.push('ce');
  return certs;
}

function makeReference(slug: string, index: number): string {
  const initials = slug
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .split('-')
    .filter(Boolean)
    .map((w) => w[0])
    .join('');
  const n = String(index + 1).padStart(2, '0');
  return `MAD-${initials}-${n}`.slice(0, 32);
}

function lexicalFromText(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}

async function upsertUser(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@mady.fr' } },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0];
  return payload.create({
    collection: 'users',
    data: {
      email: 'admin@mady.fr',
      password: 'mady-demo-2026',
      name: 'Admin Mady',
      role: 'admin',
    },
  });
}

async function upsertMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt } },
    limit: 1,
  });
  if (docs[0]) return docs[0].id;

  const created = await payload.create({
    collection: 'media',
    data: { alt },
    filePath,
  });
  return created.id;
}

async function purgeCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: 'products' | 'categories',
): Promise<void> {
  const { docs } = await payload.find({ collection, limit: 1000, depth: 0 });
  for (const doc of docs) {
    await payload.delete({ collection, id: doc.id });
  }
  if (docs.length > 0) console.warn(`  ✗ purged ${docs.length} ${collection}`);
}

async function upsertCategory(
  payload: Awaited<ReturnType<typeof getPayload>>,
  cat: ScrapedCategory,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: cat.slug } },
    limit: 1,
    locale: 'fr',
  });
  if (docs[0]) return docs[0].id;

  const created = await payload.create({
    collection: 'categories',
    locale: 'fr',
    data: {
      title: cat.name,
      slug: cat.slug,
      description: cat.description,
    },
  });
  await payload.update({
    collection: 'categories',
    id: created.id,
    locale: 'en',
    data: { title: cat.name, description: cat.description },
  });
  return created.id;
}

async function upsertProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  prod: ScrapedProduct,
  categoryId: number,
  mediaId: number,
  index: number,
): Promise<void> {
  const reference = makeReference(prod.slug, index);
  const description = prod.description || prod.title;

  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: prod.slug } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  const created = await payload.create({
    collection: 'products',
    locale: 'fr',
    data: {
      title: prod.title,
      slug: prod.slug,
      reference,
      category: categoryId,
      shortDescription: description.slice(0, 280),
      description: lexicalFromText(description) as never,
      gallery: [{ image: mediaId }],
      certifications: inferCertifications(description) as never[],
      _status: 'published',
    },
  });

  await payload.update({
    collection: 'products',
    id: created.id,
    locale: 'en',
    data: {
      title: prod.title,
      shortDescription: description.slice(0, 280),
      description: lexicalFromText(description) as never,
    },
  });
}

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  title: { fr: string; en: string },
  heroTitle?: { fr: string; en: string },
): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  const created = await payload.create({
    collection: 'pages',
    locale: 'fr',
    data: {
      title: title.fr,
      slug,
      hero: heroTitle ? { title: heroTitle.fr } : undefined,
      layout: [],
      _status: 'published',
    } as never,
  });
  await payload.update({
    collection: 'pages',
    id: created.id,
    locale: 'en',
    data: {
      title: title.en,
      hero: heroTitle ? { title: heroTitle.en } : undefined,
    } as never,
  });
}

async function upsertGlobals(
  payload: Awaited<ReturnType<typeof getPayload>>,
  categories: ScrapedCategory[],
): Promise<void> {
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      siteName: 'Mady',
      baseline: 'Bien protéger, tout simplement.',
      company: {
        legalName: 'Mady SAS',
        siret: '',
        address: 'France',
        email: 'contact@mady.fr',
        phone: '',
      },
    },
  });

  const firstCategorySlug = categories[0]?.slug ?? 'moyens-dacces';

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navigation: [
        { label: 'Accueil', href: '/fr' },
        {
          label: 'Produits',
          href: `/fr/categorie-produit/${firstCategorySlug}`,
        },
        { label: 'À propos', href: '/fr/a-propos' },
        { label: 'Contact', href: '/fr/contact' },
      ],
      cta: { label: 'Devis', href: '/fr/contact' },
    },
  });

  await payload.updateGlobal({
    slug: 'footer',
    data: {
      columns: [
        {
          heading: 'Catalogue',
          links: categories.map((c) => ({
            label: c.name,
            href: `/fr/categorie-produit/${c.slug}`,
          })),
        },
        {
          heading: 'Entreprise',
          links: [
            { label: 'À propos', href: '/fr/a-propos' },
            { label: 'Contact', href: '/fr/contact' },
          ],
        },
      ],
      contact: {
        address: 'France',
        email: 'contact@mady.fr',
      },
      legal: [
        { label: 'Mentions légales', href: '/fr/mentions-legales' },
        {
          label: 'Politique de confidentialité',
          href: '/fr/politique-confidentialite',
        },
      ],
    },
  });
}

async function upsertContactForm(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  const existing = await payload.find({
    collection: 'forms',
    where: { title: { equals: 'Contact' } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  await payload.create({
    collection: 'forms',
    data: {
      title: 'Contact',
      submitButtonLabel: 'Envoyer',
      confirmationType: 'message',
      confirmationMessage: lexicalFromText('Merci, votre message a bien été envoyé.') as never,
      fields: [
        {
          blockType: 'text',
          name: 'name',
          label: 'Nom complet',
          required: true,
          width: 100,
        },
        {
          blockType: 'email',
          name: 'email',
          label: 'Email',
          required: true,
          width: 100,
        },
        {
          blockType: 'text',
          name: 'company',
          label: 'Société',
          required: false,
          width: 100,
        },
        {
          blockType: 'text',
          name: 'phone',
          label: 'Téléphone',
          required: false,
          width: 100,
        },
        {
          blockType: 'select',
          name: 'topic',
          label: 'Sujet',
          required: true,
          width: 100,
          options: [
            { label: 'Demande de devis', value: 'quote' },
            { label: 'Question technique', value: 'tech' },
            { label: 'SAV', value: 'support' },
            { label: 'Autre', value: 'other' },
          ],
        },
        {
          blockType: 'textarea',
          name: 'message',
          label: 'Message',
          required: true,
          width: 100,
        },
      ],
    } as never,
  });
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  console.warn('→ Loading scraped data');
  const categories = await loadJson<ScrapedCategory[]>('categories.json', []);
  const products = await loadJson<ScrapedProduct[]>('products.json', []);
  if (categories.length === 0 || products.length === 0) {
    console.error('✗ No scraped data. Run `pnpm tsx scripts/scrape-mady.ts` first.');
    process.exit(1);
  }
  console.warn(`  ${categories.length} categories, ${products.length} products`);

  console.warn('→ Admin user');
  await upsertUser(payload);

  console.warn('→ Purge stale products/categories');
  await purgeCollection(payload, 'products');
  await purgeCollection(payload, 'categories');

  console.warn('→ Fallback media');
  const placeholderMedia = await upsertMedia(
    payload,
    FALLBACK_IMAGE,
    'Mady — Illustration produit',
  );

  console.warn('→ Categories');
  const catIds: Record<string, number> = {};
  for (const cat of categories) {
    catIds[cat.slug] = await upsertCategory(payload, cat);
  }

  console.warn('→ Products');
  for (const [index, prod] of products.entries()) {
    const categoryId = prod.categorySlug ? catIds[prod.categorySlug] : undefined;
    if (!categoryId) {
      console.warn(`  ⚠ skip ${prod.slug} (no category)`);
      continue;
    }

    let mediaId = placeholderMedia;
    if (prod.imageFiles[0]) {
      const filepath = path.join(ASSETS_DIR, prod.imageFiles[0]);
      try {
        mediaId = await upsertMedia(payload, filepath, prod.title);
      } catch (err) {
        console.warn(`  ⚠ image upload failed for ${prod.slug}:`, err);
      }
    }

    await upsertProduct(payload, prod, categoryId, mediaId, index);
  }

  console.warn('→ Pages');
  await upsertPage(
    payload,
    'home',
    { fr: 'Accueil', en: 'Home' },
    { fr: 'Bien protéger, tout simplement.', en: 'Safety, made simple.' },
  );
  await upsertPage(
    payload,
    'a-propos',
    { fr: 'À propos', en: 'About' },
    { fr: 'À propos de Mady', en: 'About Mady' },
  );
  await upsertPage(payload, 'mentions-legales', {
    fr: 'Mentions légales',
    en: 'Legal notice',
  });
  await upsertPage(payload, 'politique-confidentialite', {
    fr: 'Politique de confidentialité',
    en: 'Privacy policy',
  });

  console.warn('→ Globals (Header, Footer, Settings)');
  await upsertGlobals(payload, categories);

  console.warn('→ Contact form');
  await upsertContactForm(payload);

  console.warn('✓ Seed complete. Admin: admin@mady.fr / mady-demo-2026');
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed failed', err);
  process.exit(1);
});
