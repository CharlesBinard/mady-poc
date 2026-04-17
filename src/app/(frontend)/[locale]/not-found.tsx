import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-semibold text-brand-accent text-sm uppercase tracking-widest">404</p>
      <h1 className="mt-4 font-display font-semibold text-4xl text-brand-primary md:text-5xl">
        {t('title')}
      </h1>
      <p className="mt-4 max-w-prose text-lg text-muted">{t('description')}</p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">{t('cta')}</Link>
        </Button>
      </div>
    </Container>
  );
}
