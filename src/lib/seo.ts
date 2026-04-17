import { type AppLocale, routing } from '@/i18n/routing';

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

export function buildAlternates(
  locale: AppLocale,
  path: string,
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const base = siteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${base}/${l}${normalized === '/' ? '' : normalized}`]),
  );
  languages['x-default'] = `${base}/${routing.defaultLocale}${
    normalized === '/' ? '' : normalized
  }`;
  return {
    canonical: `${base}/${locale}${normalized === '/' ? '' : normalized}`,
    languages,
  };
}
