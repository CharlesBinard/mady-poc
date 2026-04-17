import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: { fr: 'Page', en: 'Page' },
    plural: { fr: 'Pages', en: 'Pages' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Contenu',
    livePreview: {
      url: ({ data, locale }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
        const slug = typeof data?.slug === 'string' ? data.slug : '';
        const localeCode = typeof locale === 'object' ? locale.code : (locale ?? 'fr');
        return slug === 'home' ? `${base}/${localeCode}` : `${base}/${localeCode}/${slug}`;
      },
    },
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
    maxPerDoc: 20,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    ...slugField('title'),
    {
      name: 'hero',
      type: 'group',
      fields: [
        { name: 'eyebrow', type: 'text', localized: true },
        { name: 'title', type: 'text', localized: true },
        { name: 'subtitle', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'cta',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', localized: true },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [],
      admin: {
        description: 'Blocs de contenu assemblés (Hero, TextImage, ProductGrid, etc.).',
      },
    },
  ],
};
