import type { Block } from 'payload';

export const FaqBlock: Block = {
  slug: 'faq',
  labels: {
    singular: { fr: 'FAQ', en: 'FAQ' },
    plural: { fr: 'FAQ', en: 'FAQs' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true, required: true },
    { name: 'intro', type: 'textarea', localized: true },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      localized: true,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
};
