import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html';
import Image from 'next/image';
import type { TextImageBlockProps } from './text-image.types';

export function TextImage({ imagePosition, eyebrow, heading, body, image }: TextImageBlockProps) {
  const imageSrc =
    typeof image === 'object' && image && typeof image.url === 'string' ? image.url : null;
  const imageAlt =
    typeof image === 'object' && image && typeof image.alt === 'string' ? image.alt : '';

  const html = body
    ? convertLexicalToHTML({
        data: body as unknown as Parameters<typeof convertLexicalToHTML>[0]['data'],
      })
    : '';
  const orderClass = imagePosition === 'left' ? 'md:order-first' : '';

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        <div>
          {eyebrow ? (
            <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-4 font-display font-semibold text-3xl text-brand-primary md:text-4xl">
            {heading}
          </h2>
          {html ? (
            <div
              className="prose prose-slate mt-6 max-w-none text-muted leading-relaxed"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Lexical HTML output is sanitized
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : null}
        </div>
        {imageSrc ? (
          <div className={`relative aspect-[4/3] overflow-hidden rounded-lg ${orderClass}`}>
            <Image src={imageSrc} alt={imageAlt} fill loading="lazy" className="object-cover" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
