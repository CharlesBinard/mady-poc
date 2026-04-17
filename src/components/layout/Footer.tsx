import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getPayloadClient } from '@/lib/payload';
import { Container } from '../ui/container';

interface FooterProps {
  locale: Locale;
}

export async function Footer({ locale }: FooterProps) {
  const payload = await getPayloadClient();
  const [footer, settings] = await Promise.all([
    payload.findGlobal({ slug: 'footer', locale, depth: 1 }),
    payload.findGlobal({ slug: 'settings', locale, depth: 1 }),
  ]);

  const columns = Array.isArray(footer.columns) ? footer.columns : [];
  const legal = Array.isArray(footer.legal) ? footer.legal : [];
  const social = Array.isArray(footer.social) ? footer.social : [];

  return (
    <footer className="mt-16 border-border border-t bg-brand-primary text-white">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2">
            <p className="font-display font-semibold text-xl">{settings.siteName ?? 'Mady'}</p>
            {settings.baseline ? (
              <p className="mt-2 text-sm text-white/70">{settings.baseline}</p>
            ) : null}
            {footer.contact?.address ? (
              <address className="mt-6 whitespace-pre-line text-sm text-white/70 not-italic">
                {footer.contact.address}
              </address>
            ) : null}
            {footer.contact?.phone ? (
              <p className="mt-2 text-sm text-white/70">
                <a href={`tel:${footer.contact.phone}`} className="hover:text-white">
                  {footer.contact.phone}
                </a>
              </p>
            ) : null}
            {footer.contact?.email ? (
              <p className="text-sm text-white/70">
                <a href={`mailto:${footer.contact.email}`} className="hover:text-white">
                  {footer.contact.email}
                </a>
              </p>
            ) : null}
          </div>
          {columns.map((col) => (
            <div key={col.id ?? col.heading}>
              <p className="font-semibold text-sm uppercase tracking-wider">{col.heading}</p>
              {col.links && col.links.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.id ?? link.label}>
                      <Link href={link.href} className="text-sm text-white/70 hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-white/10 border-t pt-8 md:flex-row md:items-center">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((item) => (
              <li key={item.id ?? item.label}>
                <Link href={item.href} className="text-sm text-white/60 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {social.length > 0 ? (
            <ul className="flex gap-4">
              {social.map((item) => (
                <li key={item.id ?? item.platform}>
                  <a
                    href={item.url}
                    aria-label={`Suivre Mady sur ${item.platform}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-white/60 hover:text-white"
                  >
                    {item.platform}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <p className="mt-8 text-white/40 text-xs">
          © {new Date().getFullYear()} {settings.siteName ?? 'Mady'}. Tous droits réservés.
        </p>
      </Container>
    </footer>
  );
}
