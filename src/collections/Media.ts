import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CollectionConfig } from 'payload';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Contenu',
  },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    imageSizes: [
      { name: 'thumbnail', width: 320, height: undefined, position: 'centre' },
      { name: 'card', width: 640, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    formatOptions: {
      format: 'webp',
      options: { quality: 85 },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Texte alternatif (accessibilité + SEO). Obligatoire.',
      },
    },
    {
      name: 'caption',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'credit',
      type: 'text',
    },
  ],
};
