# Mady POC

Refonte UI/UX du site vitrine + catalogue [mady.fr](https://mady.fr) — fabricant français d'escaliers industriels, échelles à crinoline, garde-corps et moyens d'accès.

**Stack** : Next.js 15.5 (App Router, RSC) · React 19 · Payload CMS v3 · PostgreSQL 16 · Tailwind v4 · shadcn/ui · Biome 2.3 · Vitest 4 · Playwright 1.57 · pnpm 10.

## Setup

```bash
# 1. Toolchain
corepack enable
corepack prepare pnpm@10.15.0 --activate

# 2. Dependencies
pnpm install

# 3. Env vars (cf. section Variables ci-dessous)
cp .env.example .env   # si absent, créer manuellement

# 4. Database (Postgres 16 + pgAdmin)
docker compose up -d

# 5. Brand extraction (download logo + palette from mady.fr)
pnpm extract-brand

# 6. Dev server
pnpm dev
# → http://localhost:3000
# → http://localhost:3000/admin (Payload admin)
# → http://localhost:5050 (pgAdmin — admin@mady.local / admin)
```

## Commandes

| Commande              | Rôle                                                       |
| --------------------- | ---------------------------------------------------------- |
| `pnpm dev`            | Next dev (Turbopack)                                       |
| `pnpm build`          | Build prod                                                 |
| `pnpm start`          | Start prod server                                          |
| `pnpm typecheck`      | `tsc --noEmit`                                             |
| `pnpm lint`           | Biome check                                                |
| `pnpm lint:fix`       | Biome auto-fix                                             |
| `pnpm test`           | Vitest unit                                                |
| `pnpm test:e2e`       | Playwright e2e + axe                                       |
| `pnpm analyze`        | Bundle analyzer                                            |
| `pnpm extract-brand`  | Télécharge palette + logo mady.fr                          |
| `pnpm scrape`         | Scraping assets mady.fr (respecte robots.txt, 1 req/s)     |
| `pnpm seed`           | Peuple Payload (admin + 3 catégories + 6 produits + pages) |
| `pnpm generate:types` | Génère `src/payload-types.ts`                              |

## Variables d'environnement

Créer `.env` à la racine :

```bash
# Database
DATABASE_URI=postgres://mady:mady@localhost:55432/mady

# Payload (min 32 chars)
PAYLOAD_SECRET=change-me-to-a-long-random-string-min-32-chars

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Revalidation (openssl rand -hex 32)
REVALIDATE_SECRET=change-me

# Email Brevo (free tier: 300 mails/jour)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=contact@mady.fr
BREVO_SENDER_NAME=Mady
BREVO_TO_EMAIL=contact@mady.fr
```

## Identifiants seed

Admin Payload : `admin@mady.fr` / `mady-demo-2026` (après `pnpm seed`).

## Déploiement

### POC / démo

Vercel Hobby (free) + Neon Postgres free tier (connection string **pooled** obligatoire).
⚠️ Timeout 10s sur fonctions Hobby — OK pour démo, pas pour prod.

### Prod recommandé

VPS Hetzner CX22 (~6€/mois) + Coolify/Dokploy. Docker Compose : Next + Postgres + MinIO + Caddy TLS. Processus Node persistant = pas de cold start.

### Jamais

- Cloudflare Workers (Payload requiert APIs Node).
- `cacheComponents` / `experimental.ppr` globalement (casse l'admin Payload).

## Structure

```
src/
  app/
    (frontend)/[locale]/    # site public, i18n
    (payload)/admin/...     # Payload admin (force-dynamic)
    (payload)/api/...       # Payload REST
  blocks/                   # 1 bloc = 1 dossier auto-contenu
  collections/              # Pages, Products, Categories, Media, Users, Redirects
  globals/                  # Header, Footer, Settings
  components/ui/            # shadcn primitives
  components/layout/        # Header, Footer, Breadcrumbs
  lib/                      # payload.ts, seo.ts, schema-org.ts
  i18n/                     # next-intl config + messages
```

Voir [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) pour les décisions de stack + gotchas Payload/Next.

## Licence

Propriété Mady. Usage interne POC uniquement.
