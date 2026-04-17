import type { Block } from 'payload';

export const TextImageBlock: Block = {
  slug: 'text-image',
  labels: {
    singular: { fr: 'Texte + Image', en: 'Text + Image' },
    plural: { fr: 'Blocs Texte + Image', en: 'Text + Image blocks' },
  },
  fields: [
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Image à droite', value: 'right' },
        { label: 'Image à gauche', value: 'left' },
      ],
    },
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
  ],
};
