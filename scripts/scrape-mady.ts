import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { fetch } from 'undici';

const USER_AGENT = 'mady-poc-scraper/1.0 (authorized, internal use)';
const MADY = 'https://mady.fr';
const DELAY_MS = 1000;
const DIRNAME = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const OUT_DIR = path.join(DIRNAME, 'assets');
const DATA_DIR = path.join(DIRNAME, 'data');

interface WpCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
}

interface WpOgImage {
  url?: string;
  width?: number;
  height?: number;
  type?: string;
}

interface WpProduct {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
  'categorie-produit': number[];
  yoast_head_json?: {
    title?: string;
    description?: string;
    og_image?: WpOgImage[];
  };
}

interface ScrapedCategory {
  slug: string;
  name: string;
  description: string;
  id: number;
}

interface ScrapedProduct {
  slug: string;
  title: string;
  url: string;
  description: string;
  categorySlug: string | null;
  imageFiles: string[];
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201D',
  ldquo: '\u201C',
  ndash: '\u2013',
  mdash: '\u2014',
  hellip: '\u2026',
  laquo: '\u00AB',
  raquo: '\u00BB',
  eacute: 'é',
  egrave: 'è',
  ecirc: 'ê',
  agrave: 'à',
  acirc: 'â',
  ccedil: 'ç',
  ocirc: 'ô',
  ucirc: 'û',
  ugrave: 'ù',
  icirc: 'î',
};

const decodeHtml = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return (await res.json()) as T;
}

async function downloadImage(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) {
    console.warn(`  ✗ ${res.status} image: ${url}`);
    return null;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const extMatch = url.match(/\.(jpg|jpeg|png|webp|avif)(?:\?|$)/i);
  const ext = (extMatch?.[1] ?? 'jpg').toLowerCase();
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const filename = `${hash}.${ext}`;
  const filepath = path.join(OUT_DIR, filename);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(filepath, buffer);
  return filename;
}

async function fetchCategories(): Promise<ScrapedCategory[]> {
  const raw = await fetchJson<WpCategory[]>(`${MADY}/wp-json/wp/v2/categorie-produit?per_page=50`);
  return raw.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: decodeHtml(c.name),
    description: decodeHtml(c.description.replace(/<[^>]+>/g, '').trim()),
  }));
}

async function fetchProducts(categories: ScrapedCategory[]): Promise<ScrapedProduct[]> {
  const raw = await fetchJson<WpProduct[]>(`${MADY}/wp-json/wp/v2/produit?per_page=50`);
  const byId = new Map(categories.map((c) => [c.id, c.slug]));

  const products: ScrapedProduct[] = [];
  for (const p of raw) {
    const ogImages = p.yoast_head_json?.og_image ?? [];
    const primaryImage = ogImages.find((img) => img.url)?.url;
    const imageFiles: string[] = [];

    if (primaryImage) {
      await sleep(DELAY_MS);
      console.warn(`  ↓ ${p.slug} image`);
      const filename = await downloadImage(primaryImage);
      if (filename) imageFiles.push(filename);
    }

    const categoryId = p['categorie-produit']?.[0];
    products.push({
      slug: p.slug,
      title: decodeHtml(p.title.rendered),
      url: p.link,
      description: decodeHtml(p.yoast_head_json?.description ?? ''),
      categorySlug: categoryId ? (byId.get(categoryId) ?? null) : null,
      imageFiles,
    });
  }
  return products;
}

interface WpPage {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    og_image?: WpOgImage[];
  };
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

const PAGE_SLUGS = [
  'page-accueil',
  'a-propos',
  'produits',
  'contact',
  'mentions-legales',
  'conditions',
  'confidentialite',
  'blog',
] as const;

function extractFromHtml(html: string): Pick<ScrapedPage, 'h1' | 'h2s' | 'h3s' | 'paragraphs'> {
  const $ = load(html);
  const clean = (t: string) => t.replace(/\s+/g, ' ').trim();
  const reject = (t: string) =>
    t.length < 20 ||
    t.length > 700 ||
    /document\.|getElementById|newsletter|©|droits sont réservés|Conçu par/i.test(t);

  const h1 = $('h1').first().text().trim() || null;
  const h2s = $('h2')
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((t) => t.length > 3 && t.length < 200);
  const h3s = $('h3')
    .map((_, el) => clean($(el).text()))
    .get()
    .filter((t) => t.length > 3 && t.length < 200);

  const seen = new Set<string>();
  const paragraphs: string[] = [];
  $('p, .et_pb_text_inner').each((_, el) => {
    const t = clean($(el).text());
    if (reject(t) || seen.has(t)) return;
    seen.add(t);
    paragraphs.push(t);
  });

  return { h1, h2s, h3s, paragraphs };
}

async function fetchPages(): Promise<ScrapedPage[]> {
  const raw = await fetchJson<WpPage[]>(`${MADY}/wp-json/wp/v2/pages?per_page=50`);
  const bySlug = new Map(raw.map((p) => [p.slug, p]));

  const pages: ScrapedPage[] = [];
  for (const slug of PAGE_SLUGS) {
    const wp = bySlug.get(slug);
    if (!wp) {
      console.warn(`  ⚠ page "${slug}" not found on mady.fr`);
      continue;
    }

    await sleep(DELAY_MS);
    console.warn(`→ Page: /${slug === 'page-accueil' ? '' : `${slug}/`}`);
    const res = await fetch(wp.link, {
      headers: { 'user-agent': USER_AGENT },
    });
    const html = res.ok ? await res.text() : '';
    const extracted = html ? extractFromHtml(html) : { h1: null, h2s: [], h3s: [], paragraphs: [] };

    let imageFile: string | null = null;
    const ogImage = wp.yoast_head_json?.og_image?.find((i) => i.url)?.url;
    if (ogImage) {
      await sleep(DELAY_MS);
      imageFile = await downloadImage(ogImage);
    }

    pages.push({
      slug,
      title: decodeHtml(wp.title.rendered),
      url: wp.link,
      metaDescription: decodeHtml(wp.yoast_head_json?.description ?? ''),
      imageFile,
      ...extracted,
    });
  }
  return pages;
}

interface WpPostCategory {
  id: number;
  slug: string;
  name: string;
  description: string;
  count: number;
}

interface WpPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  link: string;
  categories: number[];
  featured_media: number;
  yoast_head_json?: {
    description?: string;
    og_image?: WpOgImage[];
  };
}

interface WpMedia {
  id: number;
  source_url: string;
  alt_text?: string;
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

async function fetchPostCategories(): Promise<ScrapedPostCategory[]> {
  const raw = await fetchJson<WpPostCategory[]>(`${MADY}/wp-json/wp/v2/categories?per_page=50`);
  return raw
    .filter((c) => c.count > 0)
    .map((c) => ({
      slug: c.slug,
      name: decodeHtml(c.name),
      description: decodeHtml(c.description.replace(/<[^>]+>/g, '').trim()),
      wpId: c.id,
    }));
}

function stripTags(html: string): string {
  return decodeHtml(
    html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function fetchFeaturedMedia(id: number): Promise<string | null> {
  if (!id) return null;
  try {
    const media = await fetchJson<WpMedia>(`${MADY}/wp-json/wp/v2/media/${id}`);
    if (!media.source_url) return null;
    await sleep(DELAY_MS);
    return await downloadImage(media.source_url);
  } catch (err) {
    console.warn(`  ⚠ featured media ${id} failed:`, (err as Error).message);
    return null;
  }
}

async function fetchPosts(postCats: ScrapedPostCategory[]): Promise<ScrapedPost[]> {
  const raw = await fetchJson<WpPost[]>(`${MADY}/wp-json/wp/v2/posts?per_page=100`);
  const byId = new Map(postCats.map((c) => [c.wpId, c.slug]));

  const posts: ScrapedPost[] = [];
  for (const p of raw) {
    console.warn(`→ Post: ${p.slug}`);
    await sleep(DELAY_MS);
    const imageFile = await fetchFeaturedMedia(p.featured_media);

    const plainText = stripTags(p.content.rendered);
    const readingMinutes = Math.max(1, Math.round(wordCount(plainText) / 220));

    const firstCat = p.categories?.[0];
    const categorySlug = firstCat ? (byId.get(firstCat) ?? null) : null;

    posts.push({
      slug: p.slug,
      title: decodeHtml(p.title.rendered),
      url: p.link,
      date: p.date,
      excerpt: decodeHtml(stripTags(p.excerpt.rendered)).slice(0, 500),
      contentHtml: p.content.rendered,
      metaDescription: decodeHtml(p.yoast_head_json?.description ?? ''),
      categorySlug,
      imageFile,
      readingMinutes,
    });
  }
  return posts;
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  console.warn('→ Fetching categories from WP REST');
  const categories = await fetchCategories();
  console.warn(`  found ${categories.length} categories`);

  await sleep(DELAY_MS);
  console.warn('→ Fetching products from WP REST');
  const products = await fetchProducts(categories);
  console.warn(`  found ${products.length} products`);

  await sleep(DELAY_MS);
  console.warn('→ Fetching pages from WP REST + HTML');
  const pages = await fetchPages();
  console.warn(`  found ${pages.length} pages`);

  await sleep(DELAY_MS);
  console.warn('→ Fetching blog categories');
  const postCats = await fetchPostCategories();
  console.warn(`  found ${postCats.length} post-categories`);

  await sleep(DELAY_MS);
  console.warn('→ Fetching blog posts');
  const posts = await fetchPosts(postCats);
  console.warn(`  found ${posts.length} posts`);

  await writeFile(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2));
  await writeFile(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2));
  await writeFile(path.join(DATA_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
  await writeFile(path.join(DATA_DIR, 'post-categories.json'), JSON.stringify(postCats, null, 2));
  await writeFile(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
  console.warn(`✓ ${categories.length} categories → scripts/data/categories.json`);
  console.warn(`✓ ${products.length} products → scripts/data/products.json`);
  console.warn(`✓ ${pages.length} pages → scripts/data/pages.json`);
  console.warn(`✓ ${postCats.length} post-categories → scripts/data/post-categories.json`);
  console.warn(`✓ ${posts.length} posts → scripts/data/posts.json`);
}

main().catch((err) => {
  console.error('✗ Scrape failed', err);
  process.exit(1);
});
