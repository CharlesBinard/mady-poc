import type { Metadata } from 'next';
import '@/app/globals.css';
import { SkipToContent } from '@/components/layout/SkipToContent';
import { cn } from '@/lib/cn';
import { fontBody, fontDisplay } from '@/lib/fonts';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Mady — Escaliers et accès industriels',
    template: '%s — Mady',
  },
  description:
    "Fabricant français d'escaliers industriels, échelles à crinoline, garde-corps et moyens d'accès. Conforme NF E85-015, NF EN 1090, EN ISO 14122.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={cn(fontDisplay.variable, fontBody.variable)}>
      <body className="bg-background font-body text-foreground antialiased">
        <SkipToContent />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
