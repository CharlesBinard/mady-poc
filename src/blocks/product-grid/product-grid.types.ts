import type { Category, Product } from '@/payload-types';

export interface ProductGridBlockProps {
  blockType: 'product-grid';
  id?: string | null;
  eyebrow?: string | null;
  heading: string;
  subheading?: string | null;
  source: 'manual' | 'category';
  products?: (Product | number)[] | null;
  category?: Category | number | null;
  limit?: number | null;
  locale?: 'fr' | 'en';
}
