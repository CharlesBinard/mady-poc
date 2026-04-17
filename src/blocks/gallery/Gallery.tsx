import Image from 'next/image';
import type { GalleryBlockProps } from './gallery.types';

const columnClasses: Record<GalleryBlockProps['columns'], string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
};

export function Gallery({ heading, columns, images }: GalleryBlockProps) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        {heading ? (
          <h2 className="font-display font-semibold text-3xl text-brand-primary md:text-4xl">
            {heading}
          </h2>
        ) : null}
        <ul className={`mt-8 grid gap-4 ${columnClasses[columns]}`}>
          {images.map((entry, idx) => {
            const media = typeof entry.image === 'object' ? entry.image : null;
            const src = media && typeof media.url === 'string' ? media.url : null;
            const alt = media && typeof media.alt === 'string' ? media.alt : '';
            if (!src) return null;
            return (
              <li
                key={entry.id ?? `${idx}-${src}`}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                <Image src={src} alt={alt} fill loading="lazy" className="object-cover" />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
