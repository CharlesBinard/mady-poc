import type { CollectionConfig } from 'payload';

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: {
    singular: { fr: 'Redirection', en: 'Redirect' },
    plural: { fr: 'Redirections', en: 'Redirects' },
  },
  admin: {
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'type', 'updatedAt'],
    group: 'Configuration',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      index: true,
      admin: { description: "Chemin d'origine (ex. /ancienne-url)" },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: { description: 'Destination (chemin relatif ou URL absolue)' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 Moved Permanently', value: '301' },
        { label: '302 Found', value: '302' },
      ],
    },
  ],
};
