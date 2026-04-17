import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: { fr: 'Catégorie', en: 'Category' },
    plural: { fr: 'Catégories', en: 'Categories' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', 'updatedAt'],
    group: 'Contenu',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    ...slugField('title'),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
    },
  ],
};
