import Link from 'next/link';
import type { CtaBlockProps } from './cta.types';

export function Cta({ variant, heading, body, primary, secondary }: CtaBlockProps) {
  const isDark = variant === 'dark';
  const sectionClass = isDark ? 'bg-brand-primary text-white' : 'bg-surface text-brand-primary';
  const bodyClass = isDark ? 'text-white/80' : 'text-muted';

  return (
    <section className={`${sectionClass} py-16 md:py-24`}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-display font-semibold text-3xl md:text-4xl">{heading}</h2>
        {body ? <p className={`mx-auto mt-4 max-w-2xl ${bodyClass}`}>{body}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={primary.href}
            className="inline-flex items-center justify-center rounded-md bg-brand-accent px-6 py-3 font-medium text-white hover:bg-brand-accent/90"
          >
            {primary.label}
          </Link>
          {secondary?.label && secondary.href ? (
            <Link
              href={secondary.href}
              className={`inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium ${
                isDark
                  ? 'border-white/40 text-white hover:bg-white/10'
                  : 'border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5'
              }`}
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
