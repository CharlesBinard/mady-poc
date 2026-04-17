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
const FALLBACK_IMAGE = path.resolve(dirname, '..', 'public', 'brand', 'logo-mady.png');

interface ScrapedProduct {
  slug: string;
  title: string;
  url: string;
  description: string;
  imageFiles: string[];
}

async function loadScraped(): Promise<ScrapedProduct[]> {
  try {
    const raw = await readFile(path.join(dirname, 'data', 'products.json'), 'utf8');
    return JSON.parse(raw) as ScrapedProduct[];
  } catch {
    return [];
  }
}

const SEED_CATEGORIES = [
  {
    slug: 'moyens-acces',
    title: { fr: "Moyens d'accès", en: 'Access solutions' },
    description: {
      fr: 'Escaliers industriels, échelles à crinoline, passerelles — accès sécurisés permanents.',
      en: 'Industrial staircases, cage ladders, walkways — permanent safe access.',
    },
  },
  {
    slug: 'protection-collective',
    title: { fr: 'Protection collective', en: 'Collective protection' },
    description: {
      fr: 'Garde-corps, barrières, saut-de-loup. Conformité NF E85-015.',
      en: 'Guardrails, barriers, skylight protection. NF E85-015 compliant.',
    },
  },
  {
    slug: 'protection-individuelle',
    title: { fr: 'Protection individuelle', en: 'Individual protection' },
    description: {
      fr: "Lignes de vie, points d'ancrage, systèmes antichute.",
      en: 'Lifelines, anchor points, fall-arrest systems.',
    },
  },
];

const SEED_PRODUCTS = [
  {
    slug: 'echelle-crinoline',
    reference: 'MAD-ECR-001',
    category: 'moyens-acces',
    title: { fr: 'Échelle à crinoline', en: 'Cage ladder' },
    shortDescription: {
      fr: 'Échelle verticale fixe avec arceaux de protection dorsale. Accès toiture ou plateforme en hauteur. Conforme EN ISO 14122-4.',
      en: 'Vertical fixed ladder with dorsal safety cage. Roof or elevated platform access. EN ISO 14122-4 compliant.',
    },
    certifications: ['en-iso-14122', 'ce'],
    specs: [
      { label: 'Matériau', value: 'Acier galvanisé à chaud' },
      { label: 'Hauteur maximale', value: '10 m sans palier intermédiaire' },
      { label: 'Charge admissible', value: '150 kg par échelon' },
      { label: 'Écartement arceaux', value: '650 mm' },
    ],
  },
  {
    slug: 'escalier-industriel-droit',
    reference: 'MAD-ESC-D01',
    category: 'moyens-acces',
    title: {
      fr: 'Escalier industriel droit',
      en: 'Straight industrial staircase',
    },
    shortDescription: {
      fr: 'Escalier droit acier à marches caillebotis. Fabrication française sur mesure. Conforme NF EN 1090.',
      en: 'Straight steel staircase with grating steps. Custom made in France. NF EN 1090 compliant.',
    },
    certifications: ['nf-en-1090', 'en-iso-14122', 'ce'],
    specs: [
      { label: 'Matériau', value: 'Acier S235JR galvanisé' },
      { label: 'Angle', value: '30° à 45°' },
      { label: 'Charge admissible', value: '500 kg/m²' },
      { label: 'Largeur utile', value: '600 à 1200 mm' },
    ],
  },
  {
    slug: 'escalier-helicoidal',
    reference: 'MAD-ESC-H01',
    category: 'moyens-acces',
    title: { fr: 'Escalier hélicoïdal', en: 'Helical staircase' },
    shortDescription: {
      fr: 'Escalier en colimaçon compact pour accès silo, cuve ou mezzanine. Encombrement minimal.',
      en: 'Compact spiral staircase for silo, tank or mezzanine access. Minimal footprint.',
    },
    certifications: ['nf-en-1090', 'ce'],
    specs: [
      { label: 'Matériau', value: 'Acier galvanisé' },
      { label: 'Diamètre', value: '1500 à 2500 mm' },
      { label: 'Hauteur', value: "Jusqu'à 6 m" },
    ],
  },
  {
    slug: 'garde-corps-acier',
    reference: 'MAD-GC-001',
    category: 'protection-collective',
    title: { fr: 'Garde-corps acier', en: 'Steel guardrail' },
    shortDescription: {
      fr: 'Garde-corps préfabriqué acier. Conforme NF E85-015. Fixation toiture ou dalle.',
      en: 'Prefabricated steel guardrail. NF E85-015 compliant. Roof or slab fixation.',
    },
    certifications: ['nf-e85-015', 'nf-en-1090', 'ce'],
    specs: [
      { label: 'Matériau', value: 'Acier galvanisé à chaud' },
      { label: 'Hauteur', value: '1100 mm' },
      { label: 'Plinthe', value: '150 mm' },
      { label: "Effort d'arrêt", value: '300 N/m' },
    ],
  },
  {
    slug: 'ligne-de-vie',
    reference: 'MAD-LDV-001',
    category: 'protection-individuelle',
    title: { fr: 'Ligne de vie', en: 'Horizontal lifeline' },
    shortDescription: {
      fr: 'Ligne de vie horizontale câble inox. Maintenance toiture et façade. Conforme EN 795.',
      en: 'Stainless steel horizontal lifeline. Roof and façade maintenance. EN 795 compliant.',
    },
    certifications: ['ce'],
    specs: [
      { label: 'Câble', value: 'Inox A4 Ø 8 mm' },
      { label: 'Capacité', value: '4 utilisateurs simultanés' },
      { label: 'Portée', value: "Jusqu'à 12 m entre ancrages" },
    ],
  },
  {
    slug: 'saut-de-loup',
    reference: 'MAD-SDL-001',
    category: 'protection-collective',
    title: { fr: 'Saut-de-loup', en: 'Skylight protection' },
    shortDescription: {
      fr: 'Grille de protection acier posée sur exutoire de fumée ou lanterneau. Anti-chute.',
      en: 'Steel protection grid over smoke vent or skylight. Fall prevention.',
    },
    certifications: ['nf-e85-015', 'ce'],
    specs: [
      { label: 'Matériau', value: 'Acier galvanisé' },
      { label: 'Maille', value: '150 × 150 mm' },
      { label: 'Charge admissible', value: '1200 N/m²' },
    ],
  },
];

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
  alt: { fr: string; en: string },
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { alt: { equals: alt.fr } },
    limit: 1,
  });
  if (docs[0]) return docs[0].id;

  const created = await payload.create({
    collection: 'media',
    data: { alt: alt.fr },
    filePath,
  });
  await payload.update({
    collection: 'media',
    id: created.id,
    locale: 'en',
    data: { alt: alt.en },
  });
  return created.id;
}

async function upsertCategory(
  payload: Awaited<ReturnType<typeof getPayload>>,
  data: (typeof SEED_CATEGORIES)[number],
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: data.slug } },
    limit: 1,
    locale: 'fr',
  });

  if (docs[0]) {
    await payload.update({
      collection: 'categories',
      id: docs[0].id,
      locale: 'en',
      data: { title: data.title.en, description: data.description.en },
    });
    return docs[0].id;
  }

  const created = await payload.create({
    collection: 'categories',
    locale: 'fr',
    data: {
      title: data.title.fr,
      slug: data.slug,
      description: data.description.fr,
    },
  });
  await payload.update({
    collection: 'categories',
    id: created.id,
    locale: 'en',
    data: { title: data.title.en, description: data.description.en },
  });
  return created.id;
}

async function upsertProduct(
  payload: Awaited<ReturnType<typeof getPayload>>,
  data: (typeof SEED_PRODUCTS)[number],
  categoryId: number,
  mediaId: number,
): Promise<void> {
  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: data.slug } },
    limit: 1,
  });

  if (existing.docs[0]) {
    await payload.update({
      collection: 'products',
      id: existing.docs[0].id,
      locale: 'en',
      data: {
        title: data.title.en,
        shortDescription: data.shortDescription.en,
      },
    });
    return;
  }

  const created = await payload.create({
    collection: 'products',
    locale: 'fr',
    data: {
      title: data.title.fr,
      slug: data.slug,
      reference: data.reference,
      category: categoryId,
      shortDescription: data.shortDescription.fr,
      description: lexicalFromText(data.shortDescription.fr) as never,
      gallery: [{ image: mediaId }],
      specifications: data.specs,
      certifications: data.certifications as never[],
      _status: 'published',
    },
  });

  await payload.update({
    collection: 'products',
    id: created.id,
    locale: 'en',
    data: {
      title: data.title.en,
      shortDescription: data.shortDescription.en,
      description: lexicalFromText(data.shortDescription.en) as never,
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

async function upsertGlobals(payload: Awaited<ReturnType<typeof getPayload>>): Promise<void> {
  await payload.updateGlobal({
    slug: 'settings',
    data: {
      siteName: 'Mady',
      baseline: "Fabricant français d'escaliers et accès industriels",
      company: {
        legalName: 'Mady SAS',
        siret: '',
        address: 'France',
        email: 'contact@mady.fr',
        phone: '',
      },
    },
  });

  await payload.updateGlobal({
    slug: 'header',
    data: {
      navigation: [
        { label: 'Accueil', href: '/fr' },
        { label: 'Catégories', href: '/fr/categorie-produit/moyens-acces' },
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
          links: [
            {
              label: "Moyens d'accès",
              href: '/fr/categorie-produit/moyens-acces',
            },
            {
              label: 'Protection collective',
              href: '/fr/categorie-produit/protection-collective',
            },
            {
              label: 'Protection individuelle',
              href: '/fr/categorie-produit/protection-individuelle',
            },
          ],
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

  console.warn('→ Admin user');
  await upsertUser(payload);

  console.warn('→ Placeholder media');
  const placeholderMedia = await upsertMedia(payload, FALLBACK_IMAGE, {
    fr: 'Mady — Illustration produit',
    en: 'Mady — Product illustration',
  });

  const scraped = await loadScraped();
  console.warn(`→ ${scraped.length} scraped items loaded`);

  console.warn('→ Categories');
  const catIds: Record<string, number> = {};
  for (const cat of SEED_CATEGORIES) {
    catIds[cat.slug] = await upsertCategory(payload, cat);
  }

  console.warn('→ Products');
  for (const product of SEED_PRODUCTS) {
    const categoryId = catIds[product.category];
    if (!categoryId) continue;

    let mediaId = placeholderMedia;
    const match = scraped.find((s) => s.slug.includes(product.slug.split('-')[0] ?? product.slug));
    if (match && match.imageFiles[0]) {
      const filepath = path.join(ASSETS_DIR, match.imageFiles[0]);
      try {
        mediaId = await upsertMedia(payload, filepath, {
          fr: product.title.fr,
          en: product.title.en,
        });
      } catch (err) {
        console.warn(`  ⚠ Couldn't upload image for ${product.slug}:`, err);
      }
    }

    await upsertProduct(payload, product, categoryId, mediaId);
  }

  console.warn('→ Pages');
  await upsertPage(
    payload,
    'home',
    { fr: 'Accueil', en: 'Home' },
    {
      fr: 'Escaliers et accès industriels',
      en: 'Industrial staircases and access',
    },
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
  await upsertGlobals(payload);

  console.warn('→ Contact form');
  await upsertContactForm(payload);

  console.warn('✓ Seed complete. Admin: admin@mady.fr / mady-demo-2026');
  process.exit(0);
}

main().catch((err) => {
  console.error('✗ Seed failed', err);
  process.exit(1);
});
