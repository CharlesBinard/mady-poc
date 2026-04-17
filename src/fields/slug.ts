import type { Field } from 'payload';

const slugify = (value: string): string =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const slugField = (sourceField: string): Field[] => [
  {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: 'URL-safe identifier, auto-generated from title.',
    },
    hooks: {
      beforeValidate: [
        ({ data, operation, value }) => {
          if (typeof value === 'string' && value.length > 0) {
            return slugify(value);
          }
          if (operation === 'create' || !value) {
            const source = data?.[sourceField];
            if (typeof source === 'string' && source.length > 0) {
              return slugify(source);
            }
          }
          return value;
        },
      ],
    },
  },
];
