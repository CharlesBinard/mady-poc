import type { Media } from '@/payload-types';

export interface GalleryBlockProps {
  blockType: 'gallery';
  id?: string | null;
  heading?: string | null;
  columns: '2' | '3' | '4';
  images: { image: Media | number; id?: string | null }[];
}
