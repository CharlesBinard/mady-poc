# Architecture

## Stack

| Couche      | Techno                                      | Notes                                                 |
| ----------- | ------------------------------------------- | ----------------------------------------------------- |
| Framework   | Next.js 15.5 (App Router, RSC, Turbopack)   | LTS oct 2026                                          |
| UI          | React 19                                    | Server Components par défaut                          |
| CMS         | Payload v3 embarqué                         | `(payload)` segment, `force-dynamic`                  |
| DB          | PostgreSQL 16                               | Docker local port 55432, Neon en POC, Hetzner en prod |
| Styling     | Tailwind v4 CSS-first                       | `@theme` OKLCH, pas de `tailwind.config.js`           |
| Forms       | RHF + Zod 4                                 | Server Actions, rate-limit in-memory LRU              |
| i18n        | next-intl 3.26 + subdirectories `/fr` `/en` | hreflang + x-default via `buildAlternates`            |
| Email       | Brevo (300/j free)                          | `src/lib/email.ts`, fallback log-only                 |
| Lint+format | Biome 2.4                                   | remplace ESLint + Prettier                            |
| Tests       | Vitest 4 + Playwright 1.57 + axe            | RSC async testés en e2e                               |

## Découpage

```
src/
├── app/(frontend)/[locale]/      # site public
│   ├── layout.tsx                # Header/Footer + next-intl provider
│   ├── page.tsx                  # home (JsonLd Org+WebSite)
│   ├── produit/[slug]/           # JsonLd Product + Breadcrumb
│   ├── categorie-produit/[slug]/ # JsonLd CollectionPage + Breadcrumb
│   ├── (pages)/[...slug]/        # pages CMS dynamiques
│   ├── contact/                  # formulaire
│   └── not-found.tsx
├── app/(payload)/                # admin + REST
├── app/api/                      # revalidate (secret), redirect-lookup
├── app/{robots,sitemap,llms.txt,opengraph-image}  # SEO+GEO
├── blocks/                       # 8 blocs CMS (1 = 1 dossier: config+types+Component)
├── collections/                  # Pages, Products, Categories, Media, Users, Redirects
├── globals/                      # Header, Footer, Settings
├── components/{ui,layout,forms,seo,product}/
├── lib/{payload,seo,schema-org,cn,fonts,email,rate-limit,forms}/
├── hooks/revalidate.ts           # afterChange Payload → /api/revalidate
└── i18n/{config,routing,request,messages/}
```

## Décisions

**RSC par défaut, `'use client'` rare** : seul `FormRenderer` est client (RHF + useTransition). FAQ accordéon = `<details>` natif pour rester RSC.

**Local API Payload uniquement** (jamais REST/GraphQL côté site). Singleton via `getPayload({ config })` memoized.

**Lexical → HTML async** (`convertLexicalToHTMLAsync`) pour populer les relations dans les rich text.

**Middleware edge** consulte `/api/redirect-lookup` (Payload = Node-only, inaccessible depuis edge). Cache `next: { revalidate: 300, tags: ['redirects'] }`.

**ISR** : `export const revalidate = 3600` sur home/product/category/CMS. Invalidation : hook `afterChange` Payload → POST `/api/revalidate` avec path allowlist.

**Hreflang x-default** = `fr` (locale par défaut). Reciproque sur toutes les routes via `buildAlternates(locale, path)`.

**JSON-LD `@id`** stables : `#organization`, `#website`, `#product`, `#collection`. Category `hasPart` référence Product via même URI.

**AI crawlers** : `robots.ts` émet un bloc par bot (OAI/Claude/Perplexity/Google-Extended/GPTBot/CCBot allow ; Bytespider/Diffbot block). `llms.txt` suit spec llmstxt.org.

**Brand verrouillée** : `scripts/extract-brand.ts` asserte présence des hex `#101f2b`, `#fc4c02`, `#00b0a1`. Échoue si modif upstream non validée.

## Gotchas Payload/Next

1. **Jamais** `experimental.ppr` / `cacheComponents` / `dynamicIO` globalement — casse l'admin.
2. `(payload)/layout.tsx` a `export const dynamic = 'force-dynamic'`.
3. Hook revalidate guarde `context.isAutosave` + `doc._status !== 'published'` → pas de spam autosave (2s).
4. Fetch du hook avec `AbortSignal.timeout(3000)` pour ne pas back-pressurer les saves.
5. Connection string **pooled** sur Neon/serverless.
6. Admin Payload requiert Node runtime, incompatible Cloudflare Workers.

## Perf

Build actuel (2026-04-17) :

| Route                              | First Load JS |
| ---------------------------------- | ------------- |
| /\_not-found                       | 104 kB        |
| /[locale]                          | 112 kB (SSG)  |
| /[locale]/produit/[slug]           | 113 kB (ƒ)    |
| /[locale]/categorie-produit/[slug] | 113 kB (ƒ)    |
| shared chunks                      | 103 kB        |

Gzipped ≈ 35 kB, sous la cible de 90 kB gzip du prompt.

Lighthouse : exécuter en CI via `treosh/lighthouse-ci-action` sur preview Vercel, cible ≥ 95 perf / 100 SEO / 100 BP / ≥ 95 a11y mobile. Capture manuelle à déposer dans `docs/lighthouse.png`.

## Déploiement

**POC** : Vercel Hobby + Neon Postgres (pooled). ⚠️ Timeout 10s fonctions Hobby — OK démo, pas prod.

**Prod** : VPS Hetzner CX22 + Coolify. Docker compose Next + Postgres + MinIO + Caddy. Processus Node persistant.

**Variables d'env** : cf. `.env.example`. `REVALIDATE_SECRET` = `openssl rand -hex 32`.
