import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';
import { revalidateAfterChange } from '../hooks/revalidate';

export const PostCategories: CollectionConfig = {
  slug: 'post-categories',
  labels: {
    singular: { fr: "Catégorie d'article", en: 'Post category' },
    plural: { fr: "Catégories d'articles", en: 'Post categories' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Blog',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    ...slugField('title'),
    { name: 'description', type: 'textarea', localized: true },
  ],
};
