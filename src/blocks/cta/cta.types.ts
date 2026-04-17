export interface CtaBlockProps {
  blockType: 'cta';
  id?: string | null;
  variant: 'dark' | 'light';
  heading: string;
  body?: string | null;
  primary: { label: string; href: string };
  secondary?: { label?: string | null; href?: string | null } | null;
}
