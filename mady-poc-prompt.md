# Mady — POC de refonte du site vitrine + catalogue

> Prompt de cadrage pour un agent de développement (Claude Code / Cursor / équivalent).
> Copie-colle l'intégralité de ce fichier dans la conversation initiale, puis demande le plan en phases avant tout code.

---

## Contexte

Mady (mady.fr) est un fabricant français d'escaliers industriels, échelles à crinoline, garde-corps et moyens d'accès. Le site actuel est un WordPress avec thème sur-mesure livré par une agence. Il est lent, difficile à maintenir, SEO moyen, et l'éditrice principale (non-technique) doit pouvoir gérer seule pages, produits, formulaires et traductions.

**Autorisation explicite** : les textes, images, logos, fiches produits et assets de mady.fr appartiennent à la société. Tu peux les récupérer (scraping respectueux) et les réutiliser dans ce repo sans restriction d'usage interne.

**Nature du projet : refonte UI/UX, PAS rebranding.** On préserve l'identité visuelle Mady (logo + palette exacte) et on modernise la mise en page, la typographie, l'exécution. Voir section « Direction artistique » pour la règle d'or.

**Objectif du POC** : prouver qu'on peut livrer un site nettement supérieur à l'existant sur cinq axes mesurables — qualité du code, performance (Core Web Vitals), SEO classique, GEO (citabilité par les LLM), ergonomie d'édition. **Sans sacrifier la reconnaissance de marque.**

---

## Stack imposée (versions Avril 2026)

| Couche          | Techno                                              | Version cible                                                                          |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Framework       | **Next.js** (App Router, RSC, Server Actions)       | **15.5.x** (LTS jusqu'à oct. 2026). Si tu veux jouer agressif : 16.2.x + Payload 3.83+ |
| UI              | **React**                                           | 19.x                                                                                   |
| Runtime         | **Node**                                            | 22 LTS                                                                                 |
| Langage         | **TypeScript** strict                               | 5.4+                                                                                   |
| CMS             | **Payload CMS v3** (embarqué dans l'app Next)       | 3.81+ (3.83 si Next 16)                                                                |
| Base de données | **PostgreSQL 16** via `@payloadcms/db-postgres`     | Neon ou Postgres en Docker                                                             |
| Styling         | **Tailwind CSS v4** (CSS-first, `@theme`, OKLCH)    | 4.x                                                                                    |
| UI primitives   | **shadcn/ui** (CLI v4) + **Radix UI**               | dernière                                                                               |
| Animations      | **Motion** (ex-Framer Motion)                       | 12.x, import depuis `motion/react`                                                     |
| Icônes          | **Lucide**                                          | `lucide-react` latest                                                                  |
| Formulaires     | **React Hook Form** + **Zod 4** + shadcn `<Form>`   | latest                                                                                 |
| i18n UI         | **next-intl**                                       | latest compatible Next 15                                                              |
| i18n contenu    | **Payload Localization** (FR/EN par champ)          | natif                                                                                  |
| Éditeur riche   | **Lexical** (natif Payload v3)                      | natif                                                                                  |
| Lint + format   | **Biome v2.3** (un seul outil)                      | 2.3+                                                                                   |
| Package manager | **pnpm 10**                                         | 10.x                                                                                   |
| Bundler         | **Turbopack** (dev + build)                         | Next 15.5+ par défaut                                                                  |
| Tests unit      | **Vitest 4** + Testing Library + jsdom              | 4.x                                                                                    |
| Tests e2e       | **Playwright 1.57** + `@axe-core/playwright`        | latest                                                                                 |
| Git hooks       | **Lefthook 2**                                      | 2.1+                                                                                   |
| Env validation  | **@t3-oss/env-nextjs** + Zod                        | 0.13+                                                                                  |
| Observabilité   | Rien en POC (ajouter Sentry ou GlitchTip plus tard) | —                                                                                      |

**Biome remplace entièrement ESLint ET Prettier.** Pas d'eslint-config-next, pas de prettier-plugin-tailwindcss nécessaire : Biome 2.3 gère lint + format seul. Accepter les 2-3 règles Next manquantes (couvertes par le sens commun du dev).

---

## Non-négociables qualité code

- TypeScript `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- **Zéro `any`** (implicite ou explicite) ; `@ts-expect-error` uniquement avec justification en commentaire
- **Server Components par défaut**. `'use client'` seulement si hook browser, événement utilisateur, state interactif
- **Aucun `useEffect` pour fetcher** — RSC + Server Actions uniquement
- Pas de barrel files `index.ts` qui ré-exportent tout (tree-shaking)
- Composants < 150 lignes, une seule responsabilité
- Props typées via `interface` locale (jamais `type Props = { ... }` à l'extérieur sauf partage)
- Dossiers en `kebab-case`, composants `PascalCase`, hooks `useCamelCase`
- Variables d'env validées au démarrage via `@t3-oss/env-nextjs`
- **Pas de commentaires descriptifs du "quoi"**. Seulement le "pourquoi" non-évident
- Lint + typecheck + tests **verts** obligatoires avant toute claim de "done"
- Commits **Conventional Commits** atomiques

---

## Structure du repo

```
/
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── [locale]/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx                      # homepage
│   │   │   │   ├── (pages)/[...slug]/page.tsx    # pages CMS dynamiques
│   │   │   │   ├── categorie-produit/[slug]/page.tsx
│   │   │   │   ├── produit/[slug]/page.tsx
│   │   │   │   └── contact/page.tsx
│   │   ├── (payload)/
│   │   │   ├── admin/[[...segments]]/page.tsx
│   │   │   └── api/[...slug]/route.ts
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── opengraph-image.tsx
│   │   └── llms.txt/route.ts                      # GEO
│   ├── blocks/                                     # 1 bloc = 1 dossier auto-contenu
│   │   ├── hero/{Hero.tsx,hero.config.ts,hero.types.ts}
│   │   ├── text-image/
│   │   ├── product-grid/
│   │   ├── cta/
│   │   ├── faq/
│   │   ├── testimonials/
│   │   ├── gallery/
│   │   └── video/
│   ├── collections/
│   │   ├── Pages.ts
│   │   ├── Products.ts
│   │   ├── Categories.ts
│   │   ├── Media.ts
│   │   ├── Users.ts
│   │   └── Redirects.ts
│   ├── globals/
│   │   ├── Header.ts
│   │   ├── Footer.ts
│   │   └── Settings.ts
│   ├── components/                                 # UI réutilisable
│   │   ├── ui/                                     # shadcn components (button, card, form…)
│   │   ├── layout/                                 # Header, Footer, Breadcrumbs
│   │   └── seo/                                    # JsonLd, LocaleSwitcher
│   ├── lib/
│   │   ├── payload.ts                              # getPayload singleton
│   │   ├── seo.ts                                  # generateMetadata helpers
│   │   ├── schema-org.ts                           # JSON-LD builders
│   │   └── cn.ts                                   # clsx + tailwind-merge
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── messages/{fr,en}.json
│   ├── payload.config.ts
│   └── env.ts
├── tests/
│   ├── e2e/                                        # Playwright + axe
│   └── unit/                                       # Vitest
├── scripts/
│   ├── extract-brand.ts                            # extrait logo + palette depuis mady.fr
│   ├── scrape-mady.ts                              # récupération assets produits mady.fr
│   ├── seed.ts                                     # peuplement Payload
│   └── assets/                                     # images scrappées (gitignore)
├── docker-compose.yml                              # Postgres 16 + pgAdmin
├── biome.json
├── lefthook.yml
├── .env.example
├── README.md                                       # setup + commandes (minimal)
└── package.json
```

---

## Schéma de contenu (Payload)

### Globalisation Payload

```ts
// src/payload.config.ts (extrait)
localization: {
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  fallback: true,
},
editor: lexicalEditor({}),
plugins: [
  seoPlugin({ collections: ['pages', 'products', 'categories'] }),
  formBuilderPlugin({ fields: { text: true, email: true, select: true, checkbox: true, textarea: true, number: true } }),
  nestedDocsPlugin({ collections: ['categories'] }),
],
```

### Collection `Pages` (localisée)

- `title` (text, localized, required)
- `slug` (text, required, unique, auto depuis `title`)
- `hero` (group : eyebrow, title, subtitle, image, cta{label, href})
- `layout` (blocks : Hero, TextImage, ProductGrid, CTA, FAQ, Testimonials, Gallery, Video)
- `seo` (plugin SEO : metaTitle, metaDescription, ogImage, noindex)
- Versions + brouillons + autosave activés

### Collection `Products` (localisée)

- `title`, `slug`, `reference` (unique)
- `category` (relationship → Categories, required)
- `shortDescription` (textarea, localized)
- `description` (Lexical rich text, localized)
- `gallery` (array : image upload + alt requis)
- `specifications` (array : label + value, localized — servi en `<table>` et en `PropertyValue` schema.org)
- `certifications` (select multiple : NF E85-015, EN ISO 14122, CE, NF EN 1090)
- `documents` (array : label + upload PDF)
- `relatedProducts` (relationship many → self)
- `seo` (plugin SEO)

### Collection `Categories` (localisée, nested)

- `title`, `slug`, `description`, `heroImage`, `parent` (nested-docs), `seo`

### Collection `Media`

- Upload S3/Bunny en prod, local en dev
- Tailles auto : `thumbnail 320`, `card 640`, `hero 1920`
- Focal point obligatoire, alt obligatoire (validation Payload)

### Collection `Redirects`

- `from`, `to`, `type` (301/302) — consommée par `middleware.ts`

### Globals

- **Header** : logo, navigation (items avec sous-menus), CTA header
- **Footer** : colonnes de liens, coordonnées, réseaux sociaux, mentions légales
- **Settings** : nom du site, baseline, coordonnées entreprise (SIRET, adresse, téléphone, email), IDs tracking optionnels

### Pattern d'un bloc

```ts
// src/blocks/hero/hero.config.ts
import type { Block } from "payload";

export const Hero: Block = {
  slug: "hero",
  labels: {
    singular: { fr: "Hero", en: "Hero" },
    plural: { fr: "Héros", en: "Heroes" },
  },
  fields: [
    {
      name: "variant",
      type: "select",
      options: ["default", "split", "minimal"],
      defaultValue: "default",
    },
    { name: "eyebrow", type: "text", localized: true },
    { name: "title", type: "text", localized: true, required: true },
    { name: "subtitle", type: "textarea", localized: true },
    { name: "image", type: "upload", relationTo: "media" },
    {
      name: "cta",
      type: "group",
      fields: [
        { name: "label", type: "text", localized: true },
        { name: "href", type: "text" },
      ],
    },
  ],
};
```

```tsx
// src/blocks/hero/Hero.tsx — RSC
import Image from "next/image";
import type { HeroBlock } from "./hero.types";

export function Hero({
  variant,
  eyebrow,
  title,
  subtitle,
  image,
  cta,
}: HeroBlock) {
  // rendu selon variant, pas de 'use client'
}
```

**Contrainte forte** : 1 bloc = 1 usage visuel clair, **5-8 champs max**. Si un besoin revient 3 fois → nouveau bloc dédié, pas de bloc universel à 20 toggles.

---

## Récupération depuis Payload en RSC

**Obligation** : utiliser la **Local API** (même process), pas la REST ni GraphQL.

```ts
// src/lib/payload.ts
import config from "@/payload.config";
import { getPayload } from "payload";

export const payload = async () => getPayload({ config });
```

```tsx
// src/app/(frontend)/[locale]/produit/[slug]/page.tsx
import { payload } from "@/lib/payload";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: "fr" | "en"; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = await payload();
  const { docs } = await p.find({
    collection: "products",
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
  });
  if (!docs[0]) notFound();
  return <ProductView product={docs[0]} />;
}
```

**Pour le rich text Lexical avec population de relations** : utiliser `convertLexicalToHTMLAsync` (pas la variante sync).

---

## Next.js — patterns obligatoires

- **`generateMetadata()` async** par route, retour `alternates.canonical` + `alternates.languages` (hreflang)
- **`metadataBase`** défini dans le layout racine
- **`app/sitemap.ts`** avec `generateSitemaps()` pour chunking, `alternates.languages` par entrée
- **`app/robots.ts`** (voir GEO plus bas)
- **`app/opengraph-image.tsx`** générées via `ImageResponse` (runtime edge), texte localisé par locale
- **ISR** : `export const revalidate = 3600` sur pages publiques + `revalidateTag('product:'+slug)` déclenché par un hook Payload `afterChange` qui POST `/api/revalidate` avec secret
- **`after()`** pour fire-and-forget (analytics, webhooks, logs) sans bloquer la réponse
- **Server Actions** : fichier `'use server'`, validation Zod systématique, retour typé
- **`force-dynamic`** sur le segment `(payload)` — ne pas activer PPR/`cacheComponents` globalement (incompatible avec l'admin Payload, bugs connus)
- **`next/font`** auto-hébergé (pas de FOIT/FOUT), `<Image>` avec `priority` sur hero, `loading="lazy"` ailleurs

---

## SEO + GEO (différenciateur principal)

### robots.txt (`app/robots.ts`)

**Un bloc `User-agent:` par bot** (le wildcard est ignoré par la plupart des crawlers IA).

**Autorisés** (drivent citations) : `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended`, `Amazonbot`, `DuckAssistBot`, `GPTBot`, `CCBot` (améliore reconnaissance entité pour B2B).

**Bloqués par défaut** : `Bytespider`, `anthropic-ai` (deprecated), `cohere-ai`, `ImagesiftBot`, `Diffbot`.

Inclure `Sitemap: https://mady.fr/sitemap.xml`.

### llms.txt (`app/llms.txt/route.ts`)

Format Markdown plain à `/llms.txt` (spec llmstxt.org v1.1.0). Sections H2 pour un catalogue industriel :

```
# Mady — Fabricant français d'escaliers et accès industriels

> Mady conçoit et fabrique en France (Nîmes) des escaliers industriels,
> échelles à crinoline, garde-corps et moyens d'accès toiture. Conforme
> NF E85-015, NF EN 1090, EN ISO 14122. 20 ans d'expertise.

## Produits
- [Escalier industriel droit](https://mady.fr/produit/escalier-droit): ...
- [Échelle à crinoline](https://mady.fr/produit/echelle-crinoline): ...

## Fiches techniques
## Normes & certifications
## FAQ
## Études de cas
## Contact commercial
```

Optionnel : `/llms-full.txt` avec concaténation markdown de toutes les pages.

### JSON-LD Schema.org (par route)

- **Home** : `Organization` (ou `Manufacturer`) + `WebSite` avec `potentialAction`/`SearchAction`. `sameAs` → LinkedIn, YouTube, Societe.com, Kompass (signaux d'entité forts)
- **Product page** : `Product` avec `brand`, `manufacturer`, `material`, `weight`, `additionalProperty[]` (PropertyValue pour chaque spec), `Offer` avec `availability: InStock` + `priceSpecification` ou mention "sur devis"
- **Category page** : `CollectionPage` + `BreadcrumbList`
- **FAQ block** : `FAQPage` (les questions doivent exactement mirrorer le contenu visible — pas de stuffing)
- **Article de blog** : `Article` + `author` (Person avec credentials) pour E-E-A-T
- **Toutes pages non-home** : `BreadcrumbList`
- Utiliser des `@id` URI stables pour que les entités se référencent entre elles

**Interdit** : `LocalBusiness`/`ProfessionalService` (Mady n'a pas d'accueil walk-in), `FAQPage` sans contenu visible correspondant.

### Structure contenu pour citabilité LLM

- **Answer-first** : premier paragraphe = réponse directe en 40-60 mots, avant toute narration marketing
- **Bloc "En bref"** en haut des pages clés avec 3-5 faits chiffrés
- **H2/H3 en question naturelle** (ex : « Quelle charge admissible pour une échelle à crinoline ? ») → matche les requêtes vocales et les queries LLM
- **Tables HTML pour les specs** (dimensions, normes, charges) — les LLM les parsent bien
- **Densité factuelle** : une stat/référence chiffrée toutes les 150-200 mots, avec lien source (AFNOR, INRS, Eurocodes)
- **`dateModified`** visible en page + en schema
- **Byline auteur** avec credentials sur contenus experts
- Liens internes avec ancres descriptives

### Multilingue FR/EN

- URL : **subdirectories** `/fr/…` et `/en/…` (pattern Google recommandé, consolidé l'autorité sur un domaine)
- Racine `/` redirige vers locale détectée (Accept-Language + cookie), sinon sert `x-default`
- `hreflang` dans `<head>` **et** dans sitemap `xhtml:link`. URLs fully-qualified HTTPS, **self-referencing**, **réciproques** (Google ignore sinon)
- Slugs localisés stockés dans Payload, table de mapping pour que les alternates résolvent même quand slugs diffèrent

---

## Performance (targets)

- Core Web Vitals au 75e percentile mobile (CrUX) : **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS ≤ 0.1**
- **Lighthouse mobile** : **100 SEO / 100 Best Practices / ≥95 Perf / ≥95 A11y**
- Initial JS bundle gzip **< 90 KB** (script `pnpm analyze` via `@next/bundle-analyzer`)
- `next/image` partout, formats AVIF/WebP auto, tailles responsives
- `next/font` pour auto-hébergement (pas de Google Fonts externe runtime)
- **Aucun JS client sur une page sans interactivité**

---

## Accessibilité (WCAG 2.2 AA)

- Contraste ≥ 4.5:1 vérifié via `@axe-core/playwright` en CI
- Navigation clavier complète, focus visible jamais masqué
- `aria-label` sur icônes seules, `<nav aria-label>` sur chaque nav
- Skip-to-content link
- `prefers-reduced-motion` respecté par Motion (`<MotionConfig reducedMotion="user">`)
- Alt text obligatoire sur tous les uploads (validation Payload)

---

## Direction artistique

**Brief** : industriel français haut de gamme. Sobre, typographique, sérieux. **Pas de look SaaS ni template IA générique.** Références : Lapeyre Pro, SNCF Réseau, sites de fabricants allemands premium (Wiemann, EFAFLEX).

### Règle d'or : identité de marque Mady préservée

Le site est une **refonte UI/UX**, **pas un rebranding**. On modernise la mise en page, la typographie et l'exécution tout en gardant l'ADN visuel actuel de Mady reconnaissable.

**À conserver à l'identique** :

- **Logo Mady** (récupéré depuis mady.fr via le script de scrape, jamais recréé ni stylisé)
- **Palette de marque** (couleurs extraites de la stylesheet actuelle de mady.fr — voir tokens ci-dessous)
- **Ton éditorial** : technique, factuel, français, expertise industrielle

**À moderniser** :

- Typographie (DM Sans actuel → pairing Fraunces + Inter Tight, plus premium)
- Grille, espacement, hiérarchie visuelle
- Photo direction (cadrages, traitement)
- Micro-interactions, transitions
- Densité et respiration des pages

### Design tokens (Tailwind v4, `@theme` en OKLCH)

Couleurs extraites de `mady.fr/wp-content/themes/mady/style.css`, classées par fréquence d'utilisation :

```css
@theme {
  /* Couleurs de marque Mady — NE PAS MODIFIER */
  --color-brand-primary: #101f2b; /* bleu nuit industriel — 109 usages sur mady.fr */
  --color-brand-accent: #fc4c02; /* orange signature Mady — 45 usages, couleur CTA */
  --color-brand-secondary: #00b0a1; /* teal complémentaire — 21 usages */

  /* Neutres */
  --color-background: #ffffff;
  --color-surface: #f8f6f4; /* blanc cassé chaud mady.fr */
  --color-foreground: #101f2b; /* on réutilise la primaire comme texte */
  --color-muted: #6c757d;
  --color-border: #e0e0e0;

  /* Équivalents OKLCH (générer via culori ou oklch.com pour précision exacte) */
  /* brand-primary ≈ oklch(0.215 0.032 248) */
  /* brand-accent  ≈ oklch(0.636 0.218 35)  */
  /* brand-secondary ≈ oklch(0.679 0.109 190) */
}
```

Le bleu nuit `#101f2b` est **la** couleur Mady — utilisé pour le texte fort, les fonds de section sombres, les éléments structurants.
L'orange `#fc4c02` reste l'**accent unique CTA et highlights** (boutons primaires, icônes de statut, soulignés). Utilisé avec parcimonie, jamais en fond de bloc large.
Le teal `#00b0a1` est un **accent secondaire** pour différencier des catégories (ex : certifications, mentions normatives).

**Interdit** : inventer de nouvelles couleurs de marque, passer à du zinc/neutre pur, remplacer l'orange par une autre teinte "plus sobre". La cliente reconnaît sa marque à ces couleurs.

### Typographie (modernisation)

- **Display / titres** : **Fraunces** (serif variable Google Fonts, axes `opsz` + `SOFT` + `wght`). Utilisée sur H1/H2 avec `font-optical-sizing: auto` et `--fraunces-SOFT: 30` pour un rendu chaleureux.
- **Corps / UI** : **Inter Tight** (sans-serif variable Google Fonts). Proche en esprit du DM Sans actuel mais mieux dessiné, meilleures métriques, variable font.
- Chargement via `next/font/google` en self-hosting, variables CSS `--font-display` + `--font-body` bindées dans `@theme`.
- Deux typefaces maximum. Jamais de troisième police.

### Assets et icônes

- **Logo Mady** : téléchargé par `scripts/extract-brand.ts` (SVG si dispo, sinon PNG haute résolution), stocké dans `public/brand/logo-mady.svg`. Servi via `<Image>` sur le header avec `priority`.
- **Favicon** : récupéré depuis `madyproducts.b-cdn.net/wp-content/themes/mady/dist/images/favicon.png`, retaillé en 32/192/512 et en `.ico`.
- **Icônes UI** : Lucide exclusivement. Jamais mélanger avec FontAwesome ou Bootstrap Icons.
- **Photographie produit** : réutilisée depuis mady.fr, retravaillée (compression AVIF, focal point, alt text enrichi). Si une photo produit est faible (fond chargé, cadrage douteux), flag la dans `scripts/audit-assets.ts` pour remplacement futur.

### Grille et rythme

- 12 colonnes, spacing Tailwind par défaut, **aucun pixel magique**
- Container max 1280px, gouttières responsives
- Rythme vertical sur multiples de 8px

### Extraction automatisée à l'initialisation

Avant d'écrire un composant visuel, l'agent doit exécuter `scripts/extract-brand.ts` qui :

1. Télécharge `https://madyproducts.b-cdn.net/wp-content/themes/mady/style.css`
2. Extrait les hex colors par fréquence (top 10)
3. Télécharge le logo depuis le header de `mady.fr`
4. Télécharge le favicon
5. Génère `src/app/globals.css` initial avec les tokens ci-dessus pré-remplis
6. Rapport dans `docs/brand-extraction.md` (URL sources + hex + conversion OKLCH)

**Valeurs déjà extraites (Avril 2026, à vérifier au lancement)** :
| Rôle | Hex | Fréquence CSS | Notes |
|---|---|---|---|
| Primary | `#101f2b` | 109 | Bleu nuit, texte + structures |
| Accent CTA | `#fc4c02` | 45 | Orange signature Mady |
| Secondary | `#00b0a1` | 21 | Teal, catégories/certifications |
| Surface alt | `#f8f6f4` | 20 | Blanc cassé chaud |
| Border | `#e0e0e0` | 12 | Gris clair séparateurs |

### Anti-patterns BANNIS (vérifier avant tout rendu)

1. Hero avec **dégradé violet/bleu** + H1 gradient-text
2. **Glassmorphism** / `backdrop-blur` décoratif sans justification fonctionnelle
3. **Card-in-card-in-card** (symptôme de hiérarchie IA ratée)
4. Blocs « gros chiffre + petit label + ligne dégradée » à la SaaS
5. Hero centré + blob 3D flottant + CTA « Get started free »

### Contraintes dures à respecter

- 1 H1 par page, 1 CTA primaire au-dessus du fold, ≤ 6 sections par landing
- Photographie produit forte et réelle (pas de stock générique), whitespace rigoureux
- Animations Motion **uniquement** sur micro-interactions (hover, stagger reveal). Transitions de page : View Transitions API native + `startTransition()`
- Container queries Tailwind v4 utilisées là où c'est pertinent (cards, grids)

---

## Formulaires

- Backend : **Form Builder Payload** → l'éditrice crée ses forms (contact, demande de devis, rappel) dans l'admin
- Front : **React Hook Form** + **Zod** + shadcn `<Form>`. `superRefine` pour règles métier (RAL, dimensions, délais)
- Envoi : Server Action → Payload `submissions` + email (Resend ou Brevo existant, au choix de l'éditrice)
- Protection : rate limit IP (`upstash/ratelimit` si budget OK, sinon simple in-memory LRU par IP)

---

## Contenu initial (scripts)

### `scripts/extract-brand.ts` (à exécuter EN PREMIER)

**Obligation** : ce script doit tourner avant tout travail UI. Il garantit que les tokens CSS correspondent à la vraie marque Mady.

- Fetch `https://madyproducts.b-cdn.net/wp-content/themes/mady/style.css`
- Extrait les hex colors par fréquence (top 10), filtre les defaults Bootstrap (`#0d6efd`, `#198754`, `#dc3545`, `#ffc107`, `#6c757d` etc.) pour isoler les vraies couleurs de marque
- Fetch le logo depuis le DOM de `https://mady.fr/` (sélecteur `<img>` du header, ou SVG inline si présent) → `public/brand/logo-mady.{svg,png}`
- Fetch favicon (`madyproducts.b-cdn.net/wp-content/themes/mady/dist/images/favicon.png`) → retaille en 32/192/512 + `.ico` via `sharp`
- Convertit les hex → OKLCH via `culori`
- Écrit `src/styles/brand.css` avec les `@theme` tokens remplis
- Génère `docs/brand-extraction.md` : rapport des sources + hex + OKLCH + capture visuelle de la palette
- **Échoue le build** si les 3 couleurs de marque attendues (`#101f2b`, `#fc4c02`, `#00b0a1`) ne sont pas retrouvées (filet de sécurité contre une modification unilatérale côté mady.fr)

### `scripts/scrape-mady.ts`

- Télécharge les images produits depuis mady.fr vers `scripts/assets/` (kebab-case)
- Idempotent (skip si déjà téléchargé)
- Rate limit : **1 req/s**
- Extrait textes produits (titre, description courte, description longue, specs) → JSON intermédiaire
- Respecte `robots.txt` de mady.fr (utiliser `robots-parser`)

### `scripts/seed.ts` (`pnpm seed`)

Peuple Payload avec :

- **Homepage** : hero + product grid + CTA + testimonials
- **3 catégories** : « Moyens d'accès », « Protection collective », « Protection individuelle »
- **6 produits** : échelle à crinoline, escalier industriel droit, escalier hélicoïdal, garde-corps acier, ligne de vie, saut-de-loup
- **Pages** : À propos, Contact, Mentions légales, Politique de confidentialité
- **Menus** header + footer
- **Version EN** de la homepage + 2 produits (preuve i18n)
- Upload automatique des médias dans la collection Payload `Media`
- Utilisateur seed : `admin@mady.fr` / `mady-demo-2026`

---

## Tests

### Vitest (`tests/unit/`)

- Schémas Payload (validations, hooks)
- Builders JSON-LD (`lib/schema-org.ts`)
- Server Actions (mock Payload local API)
- Utils i18n, slug, SEO

⚠️ **Async Server Components non supportés par Vitest** → les tester en e2e.

### Playwright (`tests/e2e/`)

- Navigation : home → catégorie → produit → contact
- Changement de langue (FR ↔ EN) avec persistence
- Soumission formulaire de contact (happy path + erreurs Zod)
- Affichage produit complet (image, specs, breadcrumb, JSON-LD valide)
- **Axe** sur chaque route majeure : 0 violation sérieuse
- Lighthouse CI (`treosh/lighthouse-ci-action@v12`) sur preview deploy

---

## CI (`.github/workflows/ci.yml`)

Une seule workflow, jobs parallèles :

1. `typecheck` : `tsc --noEmit`
2. `biome` : `pnpm exec biome ci .`
3. `vitest` : `pnpm test --coverage`
4. `playwright` : shardé sur 4 workers, `microsoft/playwright-github-action`
5. `lighthouse` : sur preview Vercel, assertions sur budgets

Matrix Node 22. Cache pnpm store + Playwright browsers. Lefthook déclenche les mêmes checks en local pre-commit.

---

## Déploiement

### POC / démo

- **Vercel Hobby** (free) + **Neon Postgres** free tier (connection string **pooled** pour serverless)
- ⚠️ Timeout 10s sur les fonctions Hobby → OK pour démo, **pas pour prod** (bulk ops Payload peuvent dépasser)

### Prod recommandé

- **VPS Hetzner CX22** (~6€/mois) + **Coolify** ou **Dokploy**
- Docker Compose : Payload app + Postgres 16 + MinIO (ou S3/R2 distant) + Caddy pour TLS
- Processus Node persistant = pas de cold start, pas de timeout, meilleur pour Payload
- Backups Postgres automatiques via Coolify

### Jamais

- **Cloudflare Workers** : Payload admin requiert APIs Node non dispo
- **cacheComponents / PPR / dynamicIO** activés globalement : casse l'admin Payload

---

## Gotchas à connaître (à lire avant de coder)

1. **Ne jamais** activer `experimental.ppr` / `cacheComponents` / `dynamicIO` sur le segment `(payload)`. Scope-les au frontend uniquement si tu y tiens.
2. Admin Payload = **dynamique**. `export const dynamic = 'force-dynamic'` sur `(payload)/layout.tsx`.
3. Mutations via Server Action → **`revalidatePath`** ou **`revalidateTag`** explicite. Les hooks Payload `afterChange` doivent déclencher la revalidation.
4. Sur Vercel + Neon : **connection string pooled** obligatoire (pgBouncer), sinon exhaustion de connexions.
5. Lexical avec relations peuplées → `convertLexicalToHTMLAsync`, **pas** la sync.
6. Un seul `getPayload({ config })` par requête (Payload memoize en interne).
7. `next-intl` a des issues ouvertes avec `cacheComponents` → acceptable sur Next 15, à surveiller sur Next 16.

---

## Livrables attendus

1. Repo fonctionnel. `pnpm install && docker compose up -d && pnpm dev` démarre tout.
2. Admin Payload accessible sur `/admin` en français, utilisateur seed fonctionnel.
3. Pages livrées : homepage, 2 pages produits, 1 page catégorie, page contact avec formulaire, mentions légales. FR complet, EN partiel.
4. `docs/lighthouse.png` : screenshot Lighthouse mobile ≥ targets.
5. `docs/ARCHITECTURE.md` : une page max expliquant le découpage blocks/collections + décisions de stack.
6. Tests e2e couvrant les parcours listés.
7. README avec : setup, commandes (`dev`, `build`, `seed`, `scrape`, `test`, `test:e2e`, `lint`, `typecheck`, `analyze`), variables d'env, checklist déploiement.
8. `pnpm seed` repeuple le site depuis zéro en une commande.

## Définition de "terminé"

- [ ] `pnpm typecheck` → 0 erreur
- [ ] `pnpm exec biome ci .` → 0 erreur, 0 warning
- [ ] `pnpm test` → tous verts
- [ ] `pnpm test:e2e` → tous verts, 0 violation axe sérieuse
- [ ] `pnpm build` → succès, aucun warning Next
- [ ] Lighthouse mobile fourni, ≥ targets
- [ ] Aucun `lorem ipsum` ou placeholder laissé
- [ ] README à jour
- [ ] `llms.txt` + `robots.txt` + sitemap multilingue accessibles
- [ ] JSON-LD valide sur chaque page (vérification via Schema Markup Validator)

---

## Méthode de travail

1. **Plan d'abord**. Produis un plan détaillé en phases numérotées avant tout code. Attends validation.
2. **Phases courtes, commits atomiques** en Conventional Commits.
3. **Pas de "should work"** : toute claim de complétion s'accompagne de l'output de `typecheck` + `biome ci` + tests.
4. Hésitation entre deux approches → **expose le trade-off en une phrase** puis tranche. Ne demande pas.
5. Découverte d'une limite de la stack imposée → **signale-la**, propose un workaround documenté, puis continue.
6. Utilise **Context7 MCP** (`mcp__context7__resolve-library-id` + `mcp__context7__query-docs`) pour récupérer la doc exacte de Next.js, Payload, Tailwind, shadcn avant de coder.
7. Utilise la skill `frontend-design` si disponible pour générer les composants UI (évite le look générique IA).

**Premier livrable attendu : le plan en phases numérotées. N'écris pas une ligne de code avant validation.**
