import type { GlobalConfig } from 'payload';

export const Header: GlobalConfig = {
  slug: 'header',
  label: { fr: 'Header', en: 'Header' },
  admin: { group: 'Configuration' },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navigation',
      type: 'array',
      localized: true,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        {
          name: 'children',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', localized: true },
        { name: 'href', type: 'text' },
      ],
    },
  ],
};
