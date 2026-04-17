import type { Block } from 'payload';

export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: {
    singular: { fr: 'Galerie', en: 'Gallery' },
    plural: { fr: 'Galeries', en: 'Galleries' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 colonnes', value: '2' },
        { label: '3 colonnes', value: '3' },
        { label: '4 colonnes', value: '4' },
      ],
    },
    {
      name: 'images',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
  ],
};
