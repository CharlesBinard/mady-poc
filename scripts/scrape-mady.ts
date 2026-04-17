import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
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

const decodeHtml = (s: string): string =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, "'")
    .replace(/&#8230;/g, '…')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&agrave;/g, 'à')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ccedil;/g, 'ç');

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

  await writeFile(path.join(DATA_DIR, 'categories.json'), JSON.stringify(categories, null, 2));
  await writeFile(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2));
  console.warn(`✓ ${categories.length} categories → scripts/data/categories.json`);
  console.warn(`✓ ${products.length} products → scripts/data/products.json`);
}

main().catch((err) => {
  console.error('✗ Scrape failed', err);
  process.exit(1);
});
