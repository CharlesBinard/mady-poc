import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Cheerio, type CheerioAPI, load as loadHtml } from "cheerio";
import "dotenv/config";
process.env.SKIP_REVALIDATE = "true";

import { getPayload } from "payload";
import config from "../src/payload.config";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const ASSETS_DIR = path.join(dirname, "assets");
const DATA_DIR = path.join(dirname, "data");
const FALLBACK_IMAGE = path.resolve(
  dirname,
  "..",
  "public",
  "brand",
  "logo-mady.png",
);

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

interface ScrapedPage {
  slug: string;
  title: string;
  url: string;
  metaDescription: string;
  h1: string | null;
  h2s: string[];
  h3s: string[];
  paragraphs: string[];
  imageFile: string | null;
}

interface ScrapedPostCategory {
  slug: string;
  name: string;
  description: string;
  wpId: number;
}

interface ScrapedPost {
  slug: string;
  title: string;
  url: string;
  date: string;
  excerpt: string;
  contentHtml: string;
  metaDescription: string;
  categorySlug: string | null;
  imageFile: string | null;
  readingMinutes: number;
}

async function loadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function inferCertifications(text: string): string[] {
  const certs: string[] = [];
  const t = text.toLowerCase();
  if (/nf\s*e85-?015|e85-?015/.test(t)) certs.push("nf-e85-015");
  if (/en\s*iso\s*14122|14122/.test(t)) certs.push("en-iso-14122");
  if (/nf\s*en\s*1090|en\s*1090/.test(t)) certs.push("nf-en-1090");
  certs.push("ce");
  return certs;
}

function makeReference(slug: string, index: number): string {
  const initials = slug
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w[0])
    .join("");
  const n = String(index + 1).padStart(2, "0");
  return `MAD-${initials}-${n}`.slice(0, 32);
}

function textNode(text: string, format = 0) {
  return {
    detail: 0,
    format,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function paragraphNode(children: unknown[]) {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
  };
}

function headingNode(tag: "h2" | "h3" | "h4", children: unknown[]) {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "heading",
    version: 1,
    tag,
  };
}

function listNode(
  tag: "ul" | "ol",
  items: { text: string; format?: number }[],
) {
  return {
    children: items.map((item, i) => ({
      children: [textNode(item.text, item.format ?? 0)],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "listitem",
      version: 1,
      value: i + 1,
    })),
    direction: "ltr",
    format: "",
    indent: 0,
    type: "list",
    version: 1,
    listType: tag === "ol" ? "number" : "bullet",
    start: 1,
    tag,
  };
}

function rootNode(children: unknown[]) {
  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function lexicalFromText(text: string) {
  return rootNode([paragraphNode([textNode(text)])]);
}

// biome-ignore lint/suspicious/noExplicitAny: cheerio generic node type
function textRunsFromElement(
  $: CheerioAPI,
  el: Cheerio<any>,
  baseFormat = 0,
): unknown[] {
  const runs: unknown[] = [];
  el.contents().each((_, node) => {
    if (node.type === "text") {
      const text = node.data.replace(/\s+/g, " ");
      if (text.trim()) runs.push(textNode(text, baseFormat));
      return;
    }
    if (node.type !== "tag") return;
    const tag = node.name.toLowerCase();
    const child = $(node);
    let fmt = baseFormat;
    if (tag === "strong" || tag === "b") fmt |= 1;
    else if (tag === "em" || tag === "i") fmt |= 2;
    else if (tag === "u") fmt |= 8;
    else if (tag === "s" || tag === "del") fmt |= 4;

    if (tag === "br") {
      runs.push({ type: "linebreak", version: 1 });
      return;
    }
    if (tag === "a") {
      const href = child.attr("href") ?? "#";
      runs.push({
        type: "link",
        version: 3,
        direction: "ltr",
        format: "",
        indent: 0,
        fields: { url: href, newTab: false, linkType: "custom" },
        children: textRunsFromElement($, child, fmt),
      });
      return;
    }
    runs.push(...textRunsFromElement($, child, fmt));
  });
  return runs;
}

function lexicalFromHtml(html: string) {
  const $ = loadHtml(`<div id="__root">${html}</div>`);
  const root = $("#__root").first();
  const children: unknown[] = [];

  root.children().each((_, node) => {
    if (node.type !== "tag") return;
    const tag = node.name.toLowerCase();
    const el = $(node);

    if (tag === "h2" || tag === "h3" || tag === "h4") {
      const runs = textRunsFromElement($, el);
      if (runs.length > 0) children.push(headingNode(tag, runs));
      return;
    }
    if (tag === "ul" || tag === "ol") {
      const items: { text: string; format?: number }[] = [];
      el.children("li").each((_i, li) => {
        const text = $(li).text().replace(/\s+/g, " ").trim();
        if (text) items.push({ text });
      });
      if (items.length > 0) children.push(listNode(tag, items));
      return;
    }
    if (tag === "p") {
      const runs = textRunsFromElement($, el);
      if (runs.length > 0) children.push(paragraphNode(runs));
      return;
    }
    // fallback: extract text as paragraph
    const text = el.text().replace(/\s+/g, " ").trim();
    if (text) children.push(paragraphNode([textNode(text)]));
  });

  if (children.length === 0) {
    children.push(paragraphNode([textNode("")]));
  }
  return rootNode(children);
}

async function upsertUser(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: "admin@mady.fr" } },
    limit: 1,
  });
  if (existing.docs[0]) return existing.docs[0];
  return payload.create({
    collection: "users",
    data: {
      email: "admin@mady.fr",
      password: "mady-demo-2026",
      name: "Admin Mady",
      role: "admin",
    },
  });
}

async function upsertMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string,
): Promise<number> {
  const { docs } = await payload.find({
    collection: "media",
    where: { alt: { equals: alt } },
    limit: 1,
  });
  if (docs[0]) return docs[0].id;

  const created = await payload.create({
    collection: "media",
    data: { alt },
    filePath,
  });
  return created.id;
}

async function purgeCollection(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: "products" | "categories" | "pages" | "posts" | "post-categories",
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
    collection: "categories",
    where: { slug: { equals: cat.slug } },
    limit: 1,
    locale: "fr",
  });
  if (docs[0]) return docs[0].id;

  const created = await payload.create({
    collection: "categories",
    locale: "fr",
    data: {
      title: cat.name,
      slug: cat.slug,
      description: cat.description,
    },
  });
  await payload.update({
    collection: "categories",
    id: created.id,
    locale: "en",
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
    collection: "products",
    where: { slug: { equals: prod.slug } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  const created = await payload.create({
    collection: "products",
    locale: "fr",
    data: {
      title: prod.title,
      slug: prod.slug,
      reference,
      category: categoryId,
      shortDescription: description.slice(0, 280),
      description: lexicalFromText(description) as never,
      gallery: [{ image: mediaId }],
      certifications: inferCertifications(description) as never[],
      _status: "published",
    },
  });

  await payload.update({
    collection: "products",
    id: created.id,
    locale: "en",
    data: {
      title: prod.title,
      shortDescription: description.slice(0, 280),
      description: lexicalFromText(description) as never,
    },
  });
}

async function upsertPostCategory(
  payload: Awaited<ReturnType<typeof getPayload>>,
  cat: ScrapedPostCategory,
): Promise<number> {
  const { docs } = await payload.find({
    collection: "post-categories",
    where: { slug: { equals: cat.slug } },
    limit: 1,
    locale: "fr",
  });
  if (docs[0]) return docs[0].id;
  const created = await payload.create({
    collection: "post-categories",
    locale: "fr",
    data: {
      title: cat.name,
      slug: cat.slug,
      description: cat.description,
    },
  });
  return created.id;
}

async function upsertPost(
  payload: Awaited<ReturnType<typeof getPayload>>,
  post: ScrapedPost,
  categoryId: number | undefined,
  coverMediaId: number | undefined,
): Promise<void> {
  const existing = await payload.find({
    collection: "posts",
    where: { slug: { equals: post.slug } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  await payload.create({
    collection: "posts",
    locale: "fr",
    data: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || post.metaDescription.slice(0, 500),
      content: lexicalFromHtml(post.contentHtml) as never,
      ...(categoryId !== undefined ? { category: categoryId } : {}),
      ...(coverMediaId !== undefined ? { coverImage: coverMediaId } : {}),
      publishedAt: post.date,
      readingMinutes: post.readingMinutes,
      _status: "published",
    } as never,
  });
}

function buildHomeLayout(
  home: ScrapedPage | undefined,
  productMediaIds: number[],
  firstCategoryId: number | undefined,
) {
  if (!home) return [];
  const img = (i: number) =>
    productMediaIds[i % productMediaIds.length] ?? productMediaIds[0];

  const h1 = home.h1 ?? "Moyens d\u2019accès & protection de toiture";
  const paragraphs = home.paragraphs;
  const valuesParagraph = (start: number) =>
    paragraphs.slice(start, start + 1).filter((p) => p.length > 100);

  const quality = valuesParagraph(1)[0];
  const simplicity = valuesParagraph(2)[0];
  const trust = valuesParagraph(3)[0];

  const testimonialQuotes = home.h2s
    .filter((q) => q.startsWith("\u201C") || q.startsWith('"'))
    .map((q) => q.replace(/^["\u201C\u201D]|["\u201C\u201D]$/g, "").trim())
    .slice(0, 4);
  const testimonialAuthors = paragraphs
    .filter((p) => /^[A-ZÉÈ][a-zéèêàç]+.*?[.\s]\s*[A-Z]\./.test(p))
    .slice(0, 4);

  const layout: Record<string, unknown>[] = [
    {
      blockType: "hero",
      variant: "split",
      eyebrow: "Fabricant français",
      title: h1,
      subtitle: home.metaDescription,
      image: img(0),
      cta: { label: "Demander un devis", href: "/fr/contact" },
    },
  ];

  if (quality) {
    layout.push({
      blockType: "text-image",
      imagePosition: "right",
      eyebrow: "Qualité",
      heading: "La qualité, sans compromis",
      body: lexicalFromText(quality),
      image: img(1),
    });
  }
  if (simplicity) {
    layout.push({
      blockType: "text-image",
      imagePosition: "left",
      eyebrow: "Simplicité",
      heading: "La simplicité, toujours",
      body: lexicalFromText(simplicity),
      image: img(2),
    });
  }
  if (trust) {
    layout.push({
      blockType: "text-image",
      imagePosition: "right",
      eyebrow: "Confiance",
      heading: "Une relation de confiance",
      body: lexicalFromText(trust),
      image: img(3),
    });
  }

  if (firstCategoryId) {
    layout.push({
      blockType: "product-grid",
      eyebrow: "Nos produits",
      heading: "Découvrez notre gamme",
      subheading:
        "Accès, protection collective et individuelle, circulation sur toiture.",
      source: "category",
      category: firstCategoryId,
      limit: 6,
    });
  }

  if (testimonialQuotes.length > 0) {
    layout.push({
      blockType: "testimonials",
      heading: "Ils nous font confiance",
      items: testimonialQuotes.map((quote, i) => ({
        quote,
        author: testimonialAuthors[i] ?? "Client Mady",
      })),
    });
  }

  layout.push({
    blockType: "cta",
    variant: "dark",
    heading: "Un produit sur mesure ?",
    body: "Faites appel à nos experts pour configurer une solution adaptée à vos besoins.",
    primary: { label: "Demander un devis", href: "/fr/contact" },
    secondary: {
      label: "Voir les produits",
      href: "/fr/categorie-produit/moyens-dacces",
    },
  });

  return layout;
}

function buildAboutLayout(
  about: ScrapedPage | undefined,
  productMediaIds: number[],
) {
  if (!about) return [];
  const img = (i: number) =>
    productMediaIds[i % productMediaIds.length] ?? productMediaIds[0];
  const longParagraphs = about.paragraphs.filter((p) => p.length > 150);

  const layout: Record<string, unknown>[] = [];

  const [intro, quality, simplicity, trust] = longParagraphs;

  if (intro) {
    layout.push({
      blockType: "text-image",
      imagePosition: "right",
      eyebrow: "Notre mission",
      heading: "Sécuriser le travail en hauteur",
      body: lexicalFromText(intro),
      image: img(0),
    });
  }
  if (quality) {
    layout.push({
      blockType: "text-image",
      imagePosition: "left",
      eyebrow: "Expertise",
      heading: "Une expertise expérimentée",
      body: lexicalFromText(quality),
      image: img(1),
    });
  }
  if (simplicity) {
    layout.push({
      blockType: "text-image",
      imagePosition: "right",
      eyebrow: "Simplicité",
      heading: "La simplicité toujours",
      body: lexicalFromText(simplicity),
      image: img(2),
    });
  }
  if (trust) {
    layout.push({
      blockType: "text-image",
      imagePosition: "left",
      eyebrow: "Proximité",
      heading: "Le soutien de spécialistes",
      body: lexicalFromText(trust),
      image: img(3),
    });
  }

  layout.push({
    blockType: "cta",
    variant: "light",
    heading: "Discutons de votre projet",
    body: "Une équipe à l\u2019écoute, pour répondre à vos besoins en matière de sécurité en hauteur.",
    primary: { label: "Nous contacter", href: "/fr/contact" },
  });

  return layout;
}

interface PageSeed {
  slug: string;
  titleEn: string;
  scrapedSlug?: string;
  layout?: "home" | "about" | "simple";
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}

const PAGE_CONFIG: PageSeed[] = [
  {
    slug: "home",
    titleEn: "Home",
    scrapedSlug: "page-accueil",
    layout: "home",
  },
  {
    slug: "a-propos",
    titleEn: "About",
    scrapedSlug: "a-propos",
    layout: "about",
  },
  {
    slug: "mentions-legales",
    titleEn: "Legal notice",
    scrapedSlug: "mentions-legales",
    layout: "simple",
    fallbackTitle: "Mentions légales",
    fallbackSubtitle: "Informations légales concernant Mady SAS.",
  },
  {
    slug: "politique-confidentialite",
    titleEn: "Privacy policy",
    scrapedSlug: "confidentialite",
    layout: "simple",
    fallbackTitle: "Politique de confidentialité",
    fallbackSubtitle: "Protection et gestion de vos données personnelles.",
  },
  {
    slug: "conditions",
    titleEn: "Terms of sale",
    scrapedSlug: "conditions",
    layout: "simple",
    fallbackTitle: "Conditions générales de vente",
    fallbackSubtitle: "Nos conditions commerciales.",
  },
];

async function upsertPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  seed: PageSeed,
  scraped: ScrapedPage | undefined,
  productMediaIds: number[],
  firstCategoryId: number | undefined,
): Promise<void> {
  const title = scraped?.title ?? seed.fallbackTitle ?? seed.slug;
  const heroTitle = scraped?.h1 ?? title;
  const heroSubtitle = scraped?.metaDescription || seed.fallbackSubtitle;

  let layoutBlocks: Record<string, unknown>[] = [];
  if (seed.layout === "home") {
    layoutBlocks = buildHomeLayout(scraped, productMediaIds, firstCategoryId);
  } else if (seed.layout === "about") {
    layoutBlocks = buildAboutLayout(scraped, productMediaIds);
  }

  const hero =
    seed.layout === "home"
      ? undefined
      : {
          title: heroTitle,
          subtitle: heroSubtitle,
          ...(seed.layout === "simple" ? {} : { eyebrow: "Mady" }),
        };

  await payload.create({
    collection: "pages",
    locale: "fr",
    data: {
      title,
      slug: seed.slug,
      hero,
      layout: layoutBlocks,
      _status: "published",
    } as never,
  });
}

async function upsertGlobals(
  payload: Awaited<ReturnType<typeof getPayload>>,
  categories: ScrapedCategory[],
): Promise<void> {
  await payload.updateGlobal({
    slug: "settings",
    data: {
      siteName: "Mady",
      baseline: "Bien protéger, tout simplement.",
      company: {
        legalName: "Mady SAS",
        siret: "",
        address: "France",
        email: "bonjour@mady.fr",
        phone: "+33 4 66 26 41 13",
      },
    },
  });

  const firstCategorySlug = categories[0]?.slug ?? "moyens-dacces";

  await payload.updateGlobal({
    slug: "header",
    data: {
      navigation: [
        { label: "Accueil", href: "/fr" },
        {
          label: "Produits",
          href: `/fr/categorie-produit/${firstCategorySlug}`,
        },
        { label: "Blog", href: "/fr/blog" },
        { label: "À propos", href: "/fr/a-propos" },
        { label: "Contact", href: "/fr/contact" },
      ],
      cta: { label: "Devis", href: "/fr/contact" },
    },
  });

  await payload.updateGlobal({
    slug: "footer",
    data: {
      columns: [
        {
          heading: "Catalogue",
          links: categories.map((c) => ({
            label: c.name,
            href: `/fr/categorie-produit/${c.slug}`,
          })),
        },
        {
          heading: "Entreprise",
          links: [
            { label: "À propos", href: "/fr/a-propos" },
            { label: "Contact", href: "/fr/contact" },
          ],
        },
      ],
      contact: {
        address: "France",
        email: "bonjour@mady.fr",
        phone: "+33 4 66 26 41 13",
      },
      legal: [
        { label: "Mentions légales", href: "/fr/mentions-legales" },
        {
          label: "Politique de confidentialité",
          href: "/fr/politique-confidentialite",
        },
        { label: "CGV", href: "/fr/conditions" },
      ],
    },
  });
}

async function upsertContactForm(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<void> {
  const existing = await payload.find({
    collection: "forms",
    where: { title: { equals: "Contact" } },
    limit: 1,
  });
  if (existing.docs[0]) return;

  await payload.create({
    collection: "forms",
    data: {
      title: "Contact",
      submitButtonLabel: "Envoyer",
      confirmationType: "message",
      confirmationMessage: lexicalFromText(
        "Merci, votre message a bien été envoyé.",
      ) as never,
      fields: [
        {
          blockType: "text",
          name: "name",
          label: "Nom complet",
          required: true,
          width: 100,
        },
        {
          blockType: "email",
          name: "email",
          label: "Email",
          required: true,
          width: 100,
        },
        {
          blockType: "text",
          name: "company",
          label: "Société",
          required: false,
          width: 100,
        },
        {
          blockType: "text",
          name: "phone",
          label: "Téléphone",
          required: false,
          width: 100,
        },
        {
          blockType: "select",
          name: "topic",
          label: "Sujet",
          required: true,
          width: 100,
          options: [
            { label: "Demande de devis", value: "quote" },
            { label: "Question technique", value: "tech" },
            { label: "SAV", value: "support" },
            { label: "Autre", value: "other" },
          ],
        },
        {
          blockType: "textarea",
          name: "message",
          label: "Message",
          required: true,
          width: 100,
        },
      ],
    } as never,
  });
}

async function main(): Promise<void> {
  const payload = await getPayload({ config });

  console.warn("→ Loading scraped data");
  const categories = await loadJson<ScrapedCategory[]>("categories.json", []);
  const products = await loadJson<ScrapedProduct[]>("products.json", []);
  const pages = await loadJson<ScrapedPage[]>("pages.json", []);
  const postCategories = await loadJson<ScrapedPostCategory[]>(
    "post-categories.json",
    [],
  );
  const posts = await loadJson<ScrapedPost[]>("posts.json", []);
  if (categories.length === 0 || products.length === 0) {
    console.error(
      "✗ No scraped data. Run `pnpm tsx scripts/scrape-mady.ts` first.",
    );
    process.exit(1);
  }
  console.warn(
    `  ${categories.length} categories, ${products.length} products, ${pages.length} pages, ${postCategories.length} post-cats, ${posts.length} posts`,
  );

  console.warn("→ Admin user");
  await upsertUser(payload);

  console.warn("→ Purge stale pages/posts/products/categories");
  await purgeCollection(payload, "posts");
  await purgeCollection(payload, "post-categories");
  await purgeCollection(payload, "pages");
  await purgeCollection(payload, "products");
  await purgeCollection(payload, "categories");

  console.warn("→ Fallback media");
  const placeholderMedia = await upsertMedia(
    payload,
    FALLBACK_IMAGE,
    "Mady — Illustration produit",
  );

  console.warn("→ Categories");
  const catIds: Record<string, number> = {};
  for (const cat of categories) {
    catIds[cat.slug] = await upsertCategory(payload, cat);
  }

  console.warn("→ Products");
  const productMediaIds: number[] = [];
  for (const [index, prod] of products.entries()) {
    const categoryId = prod.categorySlug
      ? catIds[prod.categorySlug]
      : undefined;
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
    productMediaIds.push(mediaId);

    await upsertProduct(payload, prod, categoryId, mediaId, index);
  }

  console.warn("→ Pages");
  const firstCategoryId = categories[0]
    ? catIds[categories[0].slug]
    : undefined;
  const pageBySlug = new Map(pages.map((p) => [p.slug, p]));
  for (const seed of PAGE_CONFIG) {
    const scraped = seed.scrapedSlug
      ? pageBySlug.get(seed.scrapedSlug)
      : undefined;
    await upsertPage(payload, seed, scraped, productMediaIds, firstCategoryId);
  }

  console.warn("→ Post categories");
  const postCatIds: Record<string, number> = {};
  for (const cat of postCategories) {
    postCatIds[cat.slug] = await upsertPostCategory(payload, cat);
  }

  console.warn(`→ Posts (${posts.length})`);
  for (const post of posts) {
    let coverId: number | undefined;
    if (post.imageFile) {
      const filepath = path.join(ASSETS_DIR, post.imageFile);
      try {
        coverId = await upsertMedia(
          payload,
          filepath,
          `Couverture — ${post.title}`,
        );
      } catch (err) {
        console.warn(`  ⚠ cover image failed for ${post.slug}:`, err);
      }
    }
    const categoryId = post.categorySlug
      ? postCatIds[post.categorySlug]
      : undefined;
    await upsertPost(payload, post, categoryId, coverId);
  }

  console.warn("→ Globals (Header, Footer, Settings)");
  await upsertGlobals(payload, categories);

  console.warn("→ Contact form");
  await upsertContactForm(payload);

  console.warn("✓ Seed complete. Admin: admin@mady.fr / mady-demo-2026");
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Seed failed", err);
  process.exit(1);
});
