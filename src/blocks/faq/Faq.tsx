import type { FaqBlockProps } from './faq.types';

export function Faq({ heading, intro, items }: FaqBlockProps) {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="font-display font-semibold text-3xl text-brand-primary md:text-4xl">
          {heading}
        </h2>
        {intro ? <p className="mt-4 text-muted">{intro}</p> : null}
        <dl className="mt-8 divide-y divide-border">
          {items.map((item, idx) => (
            <details key={item.id ?? `${idx}-${item.question}`} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-brand-primary text-lg [&::-webkit-details-marker]:hidden">
                <dt>{item.question}</dt>
                <span
                  aria-hidden="true"
                  className="ml-4 text-brand-accent transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <dd className="mt-3 whitespace-pre-line text-muted leading-relaxed">{item.answer}</dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  );
}
