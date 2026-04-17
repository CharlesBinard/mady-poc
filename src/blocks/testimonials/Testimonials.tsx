import type { TestimonialsBlockProps } from './testimonials.types';

export function Testimonials({ heading, items }: TestimonialsBlockProps) {
  return (
    <section className="bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6">
        {heading ? (
          <h2 className="font-display font-semibold text-3xl text-brand-primary md:text-4xl">
            {heading}
          </h2>
        ) : null}
        <ul className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <li
              key={item.id ?? `${idx}-${item.author}`}
              className="rounded-lg border border-border bg-background p-6"
            >
              <blockquote className="text-brand-primary leading-relaxed">
                <p className="text-lg">“{item.quote}”</p>
                <footer className="mt-6 text-muted text-sm">
                  <strong className="text-brand-primary">{item.author}</strong>
                  {item.role || item.company ? (
                    <span>
                      {' '}
                      — {item.role}
                      {item.role && item.company ? ', ' : ''}
                      {item.company}
                    </span>
                  ) : null}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
