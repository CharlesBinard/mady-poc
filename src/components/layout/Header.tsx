import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { getPayloadClient } from '@/lib/payload';
import { Button } from '../ui/button';
import { Container } from '../ui/container';

interface HeaderProps {
  locale: Locale;
}

export async function Header({ locale }: HeaderProps) {
  const payload = await getPayloadClient();
  const header = await payload.findGlobal({ slug: 'header', locale, depth: 1 });

  const navigation = Array.isArray(header.navigation) ? header.navigation : [];
  const cta = header.cta;

  return (
    <header className="sticky top-0 z-40 border-border border-b bg-background/95 backdrop-blur">
      <Container className="flex h-20 items-center justify-between">
        <Link href={`/${locale}`} aria-label="Mady — Accueil" className="flex items-center">
          <Image
            src="/brand/logo-mady.png"
            alt="Mady"
            width={140}
            height={30}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {navigation.map((item) => (
              <li key={item.id ?? item.label}>
                <Link
                  href={item.href}
                  className="font-medium text-brand-primary text-sm transition-colors hover:text-brand-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {cta?.label && cta.href ? (
          <Button asChild size="sm">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </Container>
    </header>
  );
}
