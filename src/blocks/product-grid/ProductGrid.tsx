import Image from 'next/image';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import type { Product } from '@/payload-types';
import type { ProductGridBlockProps } from './product-grid.types';

async function resolveProducts(props: ProductGridBlockProps): Promise<Product[]> {
  const payload = await getPayloadClient();
  const limit = props.limit ?? 6;
  const locale = props.locale ?? 'fr';

  if (props.source === 'manual' && props.products) {
    const ids = props.products
      .map((p) => (typeof p === 'object' ? p.id : p))
      .filter((v): v is number => typeof v === 'number');
    if (ids.length === 0) return [];
    const { docs } = await payload.find({
      collection: 'products',
      where: { id: { in: ids } },
      locale,
      limit,
      depth: 1,
    });
    return docs;
  }

  if (props.source === 'category' && props.category) {
    const categoryId = typeof props.category === 'object' ? props.category.id : props.category;
    const { docs } = await payload.find({
      collection: 'products',
      where: { category: { equals: categoryId } },
      locale,
      limit,
      depth: 1,
    });
    return docs;
  }

  return [];
}

export async function ProductGrid(props: ProductGridBlockProps) {
  const { eyebrow, heading, subheading } = props;
  const products = await resolveProducts(props);

  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-4 font-display font-semibold text-3xl text-brand-primary md:text-4xl">
            {heading}
          </h2>
          {subheading ? (
            <p className="mt-4 text-lg text-muted leading-relaxed">{subheading}</p>
          ) : null}
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const galleryEntry = product.gallery?.[0];
            const media =
              galleryEntry && typeof galleryEntry.image === 'object' ? galleryEntry.image : null;
            const imgSrc = media && typeof media.url === 'string' ? media.url : null;
            const imgAlt = media && typeof media.alt === 'string' ? media.alt : product.title;
            return (
              <li key={product.id}>
                <Link
                  href={`/produit/${product.slug}`}
                  className="group block overflow-hidden rounded-lg border border-border bg-background transition-shadow hover:shadow-lg"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={imgAlt}
                        fill
                        loading="lazy"
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                  <div className="p-6">
                    <h3 className="font-medium text-brand-primary text-lg">{product.title}</h3>
                    {product.shortDescription ? (
                      <p className="mt-2 line-clamp-2 text-muted text-sm">
                        {product.shortDescription}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
