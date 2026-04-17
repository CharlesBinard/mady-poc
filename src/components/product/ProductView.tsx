import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { AppLocale } from '@/i18n/routing';
import type { Product } from '@/payload-types';

const CERT_LABELS: Record<string, string> = {
  'nf-e85-015': 'NF E85-015',
  'en-iso-14122': 'EN ISO 14122',
  ce: 'CE',
  'nf-en-1090': 'NF EN 1090',
};

interface ProductViewProps {
  product: Product;
  locale: AppLocale;
}

export async function ProductView({ product, locale }: ProductViewProps) {
  const t = await getTranslations('product');
  const tc = await getTranslations('common');

  const primaryImage =
    product.gallery?.[0] && typeof product.gallery[0].image === 'object'
      ? product.gallery[0].image
      : null;

  const descriptionHtml = product.description
    ? convertLexicalToHTML({
        data: product.description as unknown as Parameters<typeof convertLexicalToHTML>[0]['data'],
      })
    : '';

  return (
    <Container className="py-12">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          {primaryImage?.url ? (
            <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
              <Image
                src={primaryImage.url}
                alt={primaryImage.alt ?? product.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          {product.gallery && product.gallery.length > 1 ? (
            <ul className="grid grid-cols-4 gap-2">
              {product.gallery.slice(1, 5).map((entry) => {
                const media = typeof entry.image === 'object' ? entry.image : null;
                if (!media?.url) return null;
                return (
                  <li
                    key={entry.id ?? media.id}
                    className="relative aspect-square overflow-hidden rounded border border-border"
                  >
                    <Image
                      src={media.url}
                      alt={media.alt ?? product.title}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        <div>
          <p className="text-muted text-sm">
            {t('reference')}: <strong className="text-brand-primary">{product.reference}</strong>
          </p>
          <h1 className="mt-2 font-display font-semibold text-4xl text-brand-primary">
            {product.title}
          </h1>
          {product.shortDescription ? (
            <p className="mt-4 text-lg text-muted leading-relaxed">{product.shortDescription}</p>
          ) : null}
          {descriptionHtml ? (
            <div
              className="prose prose-slate mt-6 max-w-none"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Lexical HTML output is sanitized
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          ) : null}
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={`/${locale}/contact?ref=${product.reference}`}>{tc('requestQuote')}</Link>
            </Button>
          </div>
          {product.specifications && product.specifications.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display font-semibold text-2xl text-brand-primary">
                {t('specifications')}
              </h2>
              <table className="mt-4 w-full border-collapse text-sm">
                <tbody>
                  {product.specifications.map((spec) => (
                    <tr key={spec.id ?? spec.label} className="border-border border-b">
                      <th
                        scope="row"
                        className="py-3 pr-4 text-left font-medium text-muted align-top"
                      >
                        {spec.label}
                      </th>
                      <td className="py-3 text-brand-primary">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          {product.certifications && product.certifications.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display font-semibold text-2xl text-brand-primary">
                {t('certifications')}
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {product.certifications.map((cert) => (
                  <li
                    key={cert}
                    className="rounded-full border border-brand-secondary/40 bg-brand-secondary/10 px-3 py-1 text-brand-secondary text-sm"
                  >
                    {CERT_LABELS[cert] ?? cert}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {product.documents && product.documents.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display font-semibold text-2xl text-brand-primary">
                {t('documents')}
              </h2>
              <ul className="mt-4 space-y-2">
                {product.documents.map((doc) => {
                  const file = typeof doc.file === 'object' ? doc.file : null;
                  if (!file?.url) return null;
                  return (
                    <li key={doc.id ?? doc.label}>
                      <a
                        href={file.url}
                        className="text-brand-primary underline hover:text-brand-accent"
                      >
                        {doc.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
