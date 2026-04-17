import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Navigation and a11y', () => {
  test('homepage renders FR', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/Mady/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('product page renders with breadcrumb', async ({ page }) => {
    await page.goto('/fr/produit/echelle-crinoline');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/crinoline/i);
    await expect(page.getByRole('navigation', { name: /ariane/i })).toBeVisible();
  });

  test('category lists products', async ({ page }) => {
    await page.goto('/fr/categorie-produit/moyens-acces');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /crinoline/i })).toBeVisible();
  });

  test('JSON-LD emitted on product page', async ({ page }) => {
    await page.goto('/fr/produit/echelle-crinoline');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.length).toBeGreaterThan(0);
    const parsed = JSON.parse(scripts[0] ?? '{}') as { '@graph'?: unknown[] };
    expect(Array.isArray(parsed['@graph'])).toBe(true);
  });

  test('robots, sitemap, llms.txt accessible', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    const txt = await robots.text();
    expect(txt).toContain('User-agent: OAI-SearchBot');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();

    const llms = await request.get('/llms.txt');
    expect(llms.ok()).toBeTruthy();
    expect(await llms.text()).toMatch(/^# /);
  });

  test('axe: no serious violations on home', async ({ page }) => {
    await page.goto('/fr');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });

  test('axe: no serious violations on product', async ({ page }) => {
    await page.goto('/fr/produit/echelle-crinoline');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });
});

test.describe('Contact form', () => {
  test('shows validation errors', async ({ page }) => {
    await page.goto('/fr/contact');
    const submit = page.getByRole('button', { name: /envoyer/i });
    await submit.click();
    await expect(page.getByText(/requis/i).first()).toBeVisible();
  });
});
