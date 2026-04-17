import type { Block } from 'payload';

export const CtaBlock: Block = {
  slug: 'cta',
  labels: {
    singular: { fr: 'Appel à action', en: 'Call to action' },
    plural: { fr: 'Appels à action', en: 'Calls to action' },
  },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Fond sombre', value: 'dark' },
        { label: 'Fond clair', value: 'light' },
      ],
    },
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'body', type: 'textarea', localized: true },
    {
      name: 'primary',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true, required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'secondary',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
      ],
    },
  ],
};
