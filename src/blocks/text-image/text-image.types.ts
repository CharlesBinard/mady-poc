import type { Media } from '@/payload-types';

type LexicalEditorState = {
  root: {
    type: string;
    children: unknown[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export interface TextImageBlockProps {
  blockType: 'text-image';
  id?: string | null;
  imagePosition: 'left' | 'right';
  eyebrow?: string | null;
  heading: string;
  body?: LexicalEditorState | null;
  image: Media | number;
}
