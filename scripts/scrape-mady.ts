import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import robotsParser from 'robots-parser';
import { fetch } from 'undici';

const USER_AGENT = 'mady-poc-scraper/1.0 (authorized, internal use)';
const MADY = 'https://mady.fr';
const DELAY_MS = 1000;
const OUT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'assets');
const DATA_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), 'data');

interface ScrapedProduct {
  slug: string;
  title: string;
  url: string;
  description: string;
  imageFiles: string[];
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadRobots(): Promise<ReturnType<typeof robotsParser>> {
  const res = await fetch(`${MADY}/robots.txt`, {
    headers: { 'user-agent': USER_AGENT },
  });
  const txt = res.ok ? await res.text() : '';
  return robotsParser(`${MADY}/robots.txt`, txt);
}

async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) {
    console.warn(`  ✗ ${res.status} ${url}`);
    return null;
  }
  return res.text();
}

async function downloadImage(url: string): Promise<string | null> {
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = (url.match(/\.(jpg|jpeg|png|webp|avif)(?:\?|$)/i)?.[1] ?? 'jpg').toLowerCase();
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const filename = `${hash}.${ext}`;
  const filepath = path.join(OUT_DIR, filename);
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(filepath, buffer);
  return filename;
}

async function discoverProductUrls(): Promise<string[]> {
  const html = await fetchHtml(`${MADY}/nos-produits/`);
  if (!html) return [];
  const $ = load(html);
  const urls = new Set<string>();
  $('a[href*="/produit/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const abs = new URL(href, MADY).toString();
    if (abs.includes('/produit/')) urls.add(abs);
  });
  return [...urls].slice(0, 12);
}

async function scrapeProduct(url: string): Promise<ScrapedProduct | null> {
  const html = await fetchHtml(url);
  if (!html) return null;
  const $ = load(html);

  const title = ($('h1').first().text() || $('title').text()).trim();
  const slug =
    url.replace(/\/$/, '').split('/').pop() ??
    createHash('sha1').update(url).digest('hex').slice(0, 8);
  const description = $('meta[name="description"]').attr('content')?.trim() ?? '';

  const imageUrls = new Set<string>();
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src');
    if (!src) return;
    if (!/\.(jpg|jpeg|png|webp)/i.test(src)) return;
    if (/logo|favicon|icon|flag/i.test(src)) return;
    imageUrls.add(new URL(src, MADY).toString());
  });

  const imageFiles: string[] = [];
  for (const imgUrl of [...imageUrls].slice(0, 4)) {
    await sleep(DELAY_MS);
    const filename = await downloadImage(imgUrl);
    if (filename) imageFiles.push(filename);
  }

  return { slug, title, url, description, imageFiles };
}

async function main(): Promise<void> {
  console.warn(`→ Robots: ${MADY}/robots.txt`);
  const robots = await loadRobots();

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(DATA_DIR, { recursive: true });

  console.warn('→ Discovering product URLs');
  const urls = await discoverProductUrls();
  console.warn(`  found ${urls.length} product pages`);

  const products: ScrapedProduct[] = [];
  for (const url of urls) {
    if (!robots.isAllowed(url, USER_AGENT)) {
      console.warn(`  ⊘ blocked by robots.txt: ${url}`);
      continue;
    }
    console.warn(`→ ${url}`);
    const product = await scrapeProduct(url);
    if (product) products.push(product);
    await sleep(DELAY_MS);
  }

  await writeFile(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2));
  console.warn(`✓ ${products.length} products → scripts/data/products.json`);
}

main().catch((err) => {
  console.error('✗ Scrape failed', err);
  process.exit(1);
});
