import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';
import { revalidateAfterChange } from '../hooks/revalidate';

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: { fr: 'Produit', en: 'Product' },
    plural: { fr: 'Produits', en: 'Products' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'reference', 'category', 'updatedAt'],
    group: 'Contenu',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
    maxPerDoc: 20,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenu',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true },
            ...slugField('title'),
            {
              name: 'reference',
              type: 'text',
              required: true,
              unique: true,
              admin: {
                description: 'Référence catalogue interne (ex. MAD-ECH-001).',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
            },
            {
              name: 'shortDescription',
              type: 'textarea',
              localized: true,
              maxLength: 280,
            },
            {
              name: 'description',
              type: 'richText',
              localized: true,
            },
          ],
        },
        {
          label: 'Médias',
          fields: [
            {
              name: 'gallery',
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
        },
        {
          label: 'Specs',
          fields: [
            {
              name: 'specifications',
              type: 'array',
              localized: true,
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
              ],
            },
            {
              name: 'certifications',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'NF E85-015', value: 'nf-e85-015' },
                { label: 'EN ISO 14122', value: 'en-iso-14122' },
                { label: 'CE', value: 'ce' },
                { label: 'NF EN 1090', value: 'nf-en-1090' },
              ],
            },
          ],
        },
        {
          label: 'Documents',
          fields: [
            {
              name: 'documents',
              type: 'array',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  localized: true,
                },
                {
                  name: 'file',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'Liés',
          fields: [
            {
              name: 'relatedProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
            },
          ],
        },
      ],
    },
  ],
};
