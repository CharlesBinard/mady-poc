import type { Block } from 'payload';

export const VideoBlock: Block = {
  slug: 'video',
  labels: {
    singular: { fr: 'Vidéo', en: 'Video' },
    plural: { fr: 'Vidéos', en: 'Videos' },
  },
  fields: [
    { name: 'heading', type: 'text', localized: true },
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube', value: 'youtube' },
        { label: 'Vimeo', value: 'vimeo' },
      ],
    },
    {
      name: 'videoId',
      type: 'text',
      required: true,
      admin: { description: 'ID de la vidéo (ex. pour YouTube: dQw4w9WgXcQ)' },
    },
    { name: 'caption', type: 'text', localized: true },
  ],
};
