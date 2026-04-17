import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';
import { seoPlugin } from '@payloadcms/plugin-seo';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import { Categories } from './collections/Categories';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import { Products } from './collections/Products';
import { Redirects } from './collections/Redirects';
import { Users } from './collections/Users';
import { Footer } from './globals/Footer';
import { Header } from './globals/Header';
import { Settings } from './globals/Settings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Mady Admin',
    },
  },
  collections: [Pages, Products, Categories, Media, Users, Redirects],
  globals: [Header, Footer, Settings],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
    },
  }),
  localization: {
    locales: [
      { label: 'Français', code: 'fr' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'fr',
    fallback: true,
  },
  plugins: [
    seoPlugin({
      collections: ['pages', 'products', 'categories'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => {
        const title =
          doc && typeof doc === 'object' && 'title' in doc && typeof doc.title === 'string'
            ? doc.title
            : '';
        return title ? `${title} — Mady` : 'Mady';
      },
      generateDescription: ({ doc }) => {
        if (doc && typeof doc === 'object' && 'shortDescription' in doc) {
          const v = doc.shortDescription;
          if (typeof v === 'string') return v;
        }
        return '';
      },
    }),
    nestedDocsPlugin({
      collections: ['categories'],
      generateLabel: (_, doc) =>
        doc && typeof doc === 'object' && 'title' in doc && typeof doc.title === 'string'
          ? doc.title
          : '',
      generateURL: (docs) =>
        docs.reduce(
          (url, doc) =>
            typeof doc === 'object' && 'slug' in doc && typeof doc.slug === 'string'
              ? `${url}/${doc.slug}`
              : url,
          '',
        ),
    }),
    formBuilderPlugin({
      fields: {
        text: true,
        email: true,
        select: true,
        checkbox: true,
        textarea: true,
        number: true,
        message: true,
      },
    }),
  ],
});
