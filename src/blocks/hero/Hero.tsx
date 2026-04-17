import Image from 'next/image';
import Link from 'next/link';
import type { HeroBlockProps } from './hero.types';

export function Hero({ variant, eyebrow, title, subtitle, image, cta }: HeroBlockProps) {
  const imageSrc =
    typeof image === 'object' && image && typeof image.url === 'string' ? image.url : null;
  const imageAlt =
    typeof image === 'object' && image && typeof image.alt === 'string' ? image.alt : '';

  if (variant === 'minimal') {
    return (
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          {eyebrow ? (
            <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-4 font-display font-semibold text-4xl text-brand-primary md:text-6xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-6 text-lg text-muted leading-relaxed">{subtitle}</p> : null}
          {cta?.label && cta.href ? (
            <Link
              href={cta.href}
              className="mt-8 inline-flex items-center justify-center rounded-md bg-brand-accent px-6 py-3 font-medium text-white hover:bg-brand-accent/90"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section className="bg-background py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
          <div>
            {eyebrow ? (
              <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-4 font-display font-semibold text-4xl text-brand-primary md:text-5xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-6 text-lg text-muted leading-relaxed">{subtitle}</p>
            ) : null}
            {cta?.label && cta.href ? (
              <Link
                href={cta.href}
                className="mt-8 inline-flex items-center justify-center rounded-md bg-brand-accent px-6 py-3 font-medium text-white hover:bg-brand-accent/90"
              >
                {cta.label}
              </Link>
            ) : null}
          </div>
          {imageSrc ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
              <Image src={imageSrc} alt={imageAlt} fill priority className="object-cover" />
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-brand-primary py-24 text-white md:py-32">
      {imageSrc ? (
        <Image src={imageSrc} alt={imageAlt} fill priority className="object-cover opacity-30" />
      ) : null}
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {eyebrow ? (
          <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 font-display font-semibold text-5xl md:text-7xl">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 leading-relaxed">{subtitle}</p>
        ) : null}
        {cta?.label && cta.href ? (
          <Link
            href={cta.href}
            className="mt-8 inline-flex items-center justify-center rounded-md bg-brand-accent px-6 py-3 font-medium text-white hover:bg-brand-accent/90"
          >
            {cta.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
