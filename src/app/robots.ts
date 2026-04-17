import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

const AI_ALLOWED = [
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'Perplexity-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'DuckAssistBot',
  'CCBot',
];

const AI_BLOCKED = ['Bytespider', 'anthropic-ai', 'cohere-ai', 'ImagesiftBot', 'Diffbot'];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
      ...AI_ALLOWED.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/admin', '/api'],
      })),
      ...AI_BLOCKED.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
