import type { Locale } from '@/i18n/config';
import { Cta } from './cta/Cta';
import type { CtaBlockProps } from './cta/cta.types';
import { Faq } from './faq/Faq';
import type { FaqBlockProps } from './faq/faq.types';
import { Gallery } from './gallery/Gallery';
import type { GalleryBlockProps } from './gallery/gallery.types';
import { Hero } from './hero/Hero';
import type { HeroBlockProps } from './hero/hero.types';
import { ProductGrid } from './product-grid/ProductGrid';
import type { ProductGridBlockProps } from './product-grid/product-grid.types';
import { Testimonials } from './testimonials/Testimonials';
import type { TestimonialsBlockProps } from './testimonials/testimonials.types';
import { TextImage } from './text-image/TextImage';
import type { TextImageBlockProps } from './text-image/text-image.types';
import { Video } from './video/Video';
import type { VideoBlockProps } from './video/video.types';

export type AnyBlock =
  | HeroBlockProps
  | TextImageBlockProps
  | ProductGridBlockProps
  | CtaBlockProps
  | FaqBlockProps
  | TestimonialsBlockProps
  | GalleryBlockProps
  | VideoBlockProps;

export async function BlockRenderer({
  blocks,
  locale,
}: {
  blocks: AnyBlock[] | null | undefined;
  locale: Locale;
}) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}-${Math.random()}`;
        switch (block.blockType) {
          case 'hero':
            return <Hero key={key} {...block} />;
          case 'text-image':
            return <TextImage key={key} {...block} />;
          case 'product-grid':
            return <ProductGrid key={key} {...block} locale={locale} />;
          case 'cta':
            return <Cta key={key} {...block} />;
          case 'faq':
            return <Faq key={key} {...block} />;
          case 'testimonials':
            return <Testimonials key={key} {...block} />;
          case 'gallery':
            return <Gallery key={key} {...block} />;
          case 'video':
            return <Video key={key} {...block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
