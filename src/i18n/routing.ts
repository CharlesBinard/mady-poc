import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'] as const,
  defaultLocale: 'fr',
  localePrefix: 'always',
});

export type AppLocale = (typeof routing.locales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return typeof value === 'string' && (routing.locales as readonly string[]).includes(value);
}
