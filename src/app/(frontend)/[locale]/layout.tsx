import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { isAppLocale, routing } from '@/i18n/routing';

export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
    </NextIntlClientProvider>
  );
}
