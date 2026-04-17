import type { CollectionConfig } from 'payload';
import { slugField } from '../fields/slug';
import { revalidateAfterChange } from '../hooks/revalidate';

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: { fr: 'Article', en: 'Post' },
    plural: { fr: 'Articles', en: 'Posts' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'updatedAt'],
    group: 'Blog',
    livePreview: {
      url: ({ data, locale }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
        const slug = typeof data?.slug === 'string' ? data.slug : '';
        const localeCode = typeof locale === 'object' ? locale.code : (locale ?? 'fr');
        return `${base}/${localeCode}/blog/${slug}`;
      },
    },
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
  defaultSort: '-publishedAt',
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
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              maxLength: 500,
              admin: {
                description: "Résumé affiché sur la liste d'articles (≤500 caractères).",
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              localized: true,
            },
          ],
        },
        {
          label: 'Métadonnées',
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'post-categories',
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                  displayFormat: 'dd/MM/yyyy HH:mm',
                },
                position: 'sidebar',
              },
            },
            {
              name: 'readingMinutes',
              type: 'number',
              admin: {
                description: 'Durée de lecture estimée (minutes).',
                position: 'sidebar',
              },
            },
          ],
        },
      ],
    },
  ],
};
