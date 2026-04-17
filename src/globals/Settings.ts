import type { GlobalConfig } from 'payload';

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: { fr: 'Paramètres', en: 'Settings' },
  admin: { group: 'Configuration' },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'siteName', type: 'text', required: true, defaultValue: 'Mady' },
    { name: 'baseline', type: 'text', localized: true },
    {
      name: 'company',
      type: 'group',
      fields: [
        { name: 'legalName', type: 'text' },
        { name: 'siret', type: 'text' },
        { name: 'vat', type: 'text' },
        { name: 'address', type: 'textarea' },
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'text' },
      ],
    },
    {
      name: 'tracking',
      type: 'group',
      fields: [
        { name: 'plausibleDomain', type: 'text' },
        { name: 'gtmId', type: 'text' },
      ],
    },
  ],
};
