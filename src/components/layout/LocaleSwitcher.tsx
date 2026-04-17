import Link from 'next/link';
import { type Locale, locales } from '@/i18n/config';
import { cn } from '@/lib/cn';

interface LocaleSwitcherProps {
  current: Locale;
  hrefMap?: Partial<Record<Locale, string>>;
}

export function LocaleSwitcher({ current, hrefMap }: LocaleSwitcherProps) {
  return (
    <nav aria-label="Choix de la langue" className="flex items-center gap-2 text-sm">
      {locales.map((locale) => {
        const href = hrefMap?.[locale] ?? `/${locale}`;
        const isActive = locale === current;
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded px-2 py-1 font-medium uppercase transition-colors',
              isActive ? 'text-brand-accent' : 'text-muted hover:text-brand-primary',
            )}
          >
            {locale}
          </Link>
        );
      })}
    </nav>
  );
}
