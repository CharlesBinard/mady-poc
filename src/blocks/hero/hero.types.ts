import type { Media } from '@/payload-types';

export type HeroVariant = 'default' | 'split' | 'minimal';

export interface HeroBlockProps {
  blockType: 'hero';
  id?: string | null;
  variant: HeroVariant;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  image?: Media | number | null;
  cta?: {
    label?: string | null;
    href?: string | null;
  } | null;
}
