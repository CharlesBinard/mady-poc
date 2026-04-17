import type { Block } from 'payload';

export const ProductGridBlock: Block = {
  slug: 'product-grid',
  labels: {
    singular: { fr: 'Grille de produits', en: 'Product grid' },
    plural: { fr: 'Grilles de produits', en: 'Product grids' },
  },
  fields: [
    { name: 'eyebrow', type: 'text', localized: true },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'subheading', type: 'textarea', localized: true },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Sélection manuelle', value: 'manual' },
        { label: 'Par catégorie', value: 'category' },
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'manual',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'category',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 6,
      min: 1,
      max: 24,
    },
  ],
};
