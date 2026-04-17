# Mady POC — Plan d'implémentation en phases

> Plan de cadrage pour refonte UI/UX + catalogue mady.fr.
> Spec source : `mady-poc-prompt.md` (racine repo).
> **À valider avant tout code.** Chaque phase = un chunk de commits atomiques Conventional Commits, testable en isolation.

**Goal** : livrer un site Next.js 15 / Payload v3 supérieur à mady.fr actuel sur 5 axes (code, perf, SEO, GEO, édition) sans toucher à l'identité de marque.

**Architecture** : monorepo Next App Router, Payload embarqué (`(payload)` segment), PostgreSQL via Docker, RSC par défaut, Server Actions pour mutations, Tailwind v4 CSS-first, blocs atomiques auto-contenus.

**Stack imposée** : Next 15.5 / React 19 / Node 22 / Payload 3.81+ / Tailwind v4 / shadcn/ui / Motion / Biome 2.3 / Vitest 4 / Playwright 1.57 / pnpm 10.

---

## Vue d'ensemble des phases

| #   | Phase                                        | Sortie vérifiable                                                     | Durée estim. |
| --- | -------------------------------------------- | --------------------------------------------------------------------- | ------------ |
| 0   | Bootstrap & tooling                          | `pnpm dev` démarre, CI verte à vide                                   | 0.5j         |
| 1   | Extraction marque & tokens                   | `scripts/extract-brand.ts` OK, `docs/brand-extraction.md`, tokens CSS | 0.5j         |
| 2   | Payload config + collections                 | Admin `/admin` accessible, schémas FR/EN valides                      | 1j           |
| 3   | Blocs CMS + rendus RSC                       | 8 blocs livrés, Storybook-lite ou page de démo                        | 1.5j         |
| 4   | Design system shadcn + layout                | Header, Footer, primitives UI, typo Fraunces + Inter Tight            | 1j           |
| 5   | Pages catalogue (produit, catégorie)         | 2 produits + 1 catégorie rendus, breadcrumbs, specs                   | 1j           |
| 6   | i18n FR/EN + routing localisé                | Subdirectories `/fr` `/en`, hreflang, sitemap multi                   | 0.5j         |
| 7   | SEO + GEO complet                            | `robots.ts`, `llms.txt`, JSON-LD par route, OG images                 | 1j           |
| 8   | Formulaires (Form Builder + RHF + Zod)       | Contact + devis fonctionnels, rate-limit, submission Payload          | 0.5j         |
| 9   | Scraping & seed                              | `pnpm scrape` + `pnpm seed` repeuplent from scratch                   | 1j           |
| 10  | Tests unit (Vitest) + e2e (Playwright + axe) | Tous verts, 0 violation sérieuse axe                                  | 1j           |
| 11  | Perf tuning + Lighthouse                     | Targets atteintes, bundle analyzer run                                | 0.5j         |
| 12  | CI GitHub Actions + docs finales             | CI matrix verte, README + ARCHITECTURE.md                             | 0.5j         |

**Total estim. : ~10 jours-homme.** Chaque phase close se termine par : `pnpm typecheck && pnpm exec biome ci . && pnpm test && git commit`.

---

## Phase 0 — Bootstrap & tooling

**Objectif** : squelette Next + Payload qui `pnpm dev` sans contenu. Tooling qualité en place.

**Fichiers** :

- Create : `package.json`, `tsconfig.json`, `next.config.ts`, `biome.json`, `lefthook.yml`, `docker-compose.yml`, `.env.example`, `.gitignore`, `.node-version`, `README.md`
- Create : `src/env.ts`, `src/payload.config.ts` (stub), `src/app/(payload)/admin/[[...segments]]/page.tsx`, `src/app/(frontend)/layout.tsx`

**Étapes** :

1. `pnpm init` + deps pinned (Next 15.5.x, React 19, Payload 3.81+, Tailwind v4, Biome 2.3, Vitest 4, Playwright 1.57, pnpm 10).
2. `tsconfig.json` : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, paths `@/*`.
3. `biome.json` : lint + format Tailwind-aware, import sort, rules recommandées.
4. `docker-compose.yml` : Postgres 16 + pgAdmin (ports 5432 + 5050).
5. `.env.example` : `DATABASE_URI`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`.
6. `src/env.ts` : validation Zod via `@t3-oss/env-nextjs`.
7. Stub Payload config minimal (collection `users` uniquement) + route admin.
8. `lefthook.yml` : pre-commit → `biome ci` + `tsc --noEmit`.
9. `README.md` minimal : commandes.

**Vérif** :

- `docker compose up -d && pnpm dev` → Next tourne sur :3000, admin `/admin` charge (écran création user).
- `pnpm typecheck && pnpm exec biome ci .` → 0 erreur.
- Commit : `chore: bootstrap Next 15 + Payload v3 skeleton`.

---

## Phase 1 — Extraction marque & tokens

**Objectif** : couleurs Mady verrouillées dans `@theme`, logo + favicon téléchargés, rapport généré.

**Fichiers** :

- Create : `scripts/extract-brand.ts`, `scripts/utils/oklch.ts`, `src/styles/brand.css`, `src/app/globals.css`, `public/brand/logo-mady.svg` (via script), `public/favicon.ico`, `docs/brand-extraction.md`

**Étapes** :

1. `scripts/extract-brand.ts` : fetch stylesheet mady.fr, parse hex par fréquence, filtre defaults Bootstrap.
2. Assert présence des 3 hex attendus (`#101f2b`, `#fc4c02`, `#00b0a1`). Sinon échec build.
3. Conversion OKLCH via `culori`.
4. Fetch logo depuis DOM `mady.fr` (header `<img>` ou SVG inline).
5. Fetch favicon `madyproducts.b-cdn.net/.../favicon.png`, retaille 32/192/512 via `sharp`, génère `.ico`.
6. Écrit `src/styles/brand.css` avec `@theme` OKLCH + hex fallback.
7. Génère `docs/brand-extraction.md` (sources, palette, captures).
8. `globals.css` importe `brand.css` et `tailwindcss`.

**Vérif** :

- `pnpm tsx scripts/extract-brand.ts` → exit 0, fichiers écrits.
- Visuel : carré de chaque couleur rendu dans une page `/debug/tokens` (éphémère, à supprimer en fin de phase).
- Commit : `feat(brand): extract Mady palette + assets, generate OKLCH tokens`.

---

## Phase 2 — Payload config + collections

**Objectif** : schémas CMS complets, localisation FR/EN, admin fonctionnel, users seed.

**Fichiers** :

- Create : `src/payload.config.ts` (complet), `src/collections/{Pages,Products,Categories,Media,Users,Redirects}.ts`, `src/globals/{Header,Footer,Settings}.ts`, `src/lib/payload.ts`

**Étapes** :

1. `payload.config.ts` : `@payloadcms/db-postgres`, `lexicalEditor`, localization FR/EN + fallback, plugins `seoPlugin` + `formBuilderPlugin` + `nestedDocsPlugin`.
2. Collections avec champs spec'd (voir prompt lignes 161-195).
3. Validation Payload : alt obligatoire sur Media, focal point, références certifications (select multi).
4. Hooks `afterChange` → POST `/api/revalidate` (stub, finalisé phase 7).
5. `lib/payload.ts` : singleton `getPayload({ config })` memoize par requête.
6. Versions + drafts + autosave sur `Pages` et `Products`.

**Vérif** :

- `pnpm dev`, admin `/admin` : crée user, voit toutes collections + globals.
- Crée 1 page + 1 produit avec traduction EN, sauvegarde → Postgres.
- `pnpm typecheck` propre.
- Commit : `feat(payload): collections, globals, localization FR/EN`.

---

## Phase 3 — Blocs CMS + rendus RSC

**Objectif** : 8 blocs auto-contenus `(config.ts + types.ts + Component.tsx)`, rendus RSC, pattern partagé.

**Fichiers** :

- Create : `src/blocks/{hero,text-image,product-grid,cta,faq,testimonials,gallery,video}/` (3 fichiers chacun).
- Create : `src/blocks/renderer.tsx` (dispatcher switch sur `blockType`).

**Étapes par bloc** (répéter pour chacun) :

1. `xxx.config.ts` : `Block` Payload, labels FR/EN, 5-8 champs max, localized où pertinent.
2. `xxx.types.ts` : interface dérivée (pas d'import Payload côté client).
3. `Xxx.tsx` : RSC, variants via `select`, sans `'use client'` sauf hook nécessaire.
4. Enregistre dans `payload.config.ts` via `Pages.layout.blocks`.
5. `renderer.tsx` : mappe `blockType` → composant.

**Contraintes** :

- Pas de `use client` sauf nécessité (Motion côté FAQ accordéon OK).
- Image via `next/image`, `priority` sur Hero uniquement.
- Motion `<MotionConfig reducedMotion="user">` au layout racine.

**Vérif** :

- Page de test `/debug/blocks` rend les 8 blocs avec data fixture.
- Lighthouse a11y ≥ 95 sur cette page.
- Commit par bloc : `feat(blocks): add <name> block`.

---

## Phase 4 — Design system shadcn + layout

**Objectif** : shadcn init, primitives UI, typo Fraunces + Inter Tight self-hosted, Header + Footer globaux consommant Payload globals.

**Fichiers** :

- Create : `src/components/ui/{button,card,form,input,label,select,textarea,checkbox,separator,sheet,navigation-menu,breadcrumb}.tsx` (shadcn CLI v4)
- Create : `src/components/layout/{Header,Footer,Breadcrumbs,LocaleSwitcher,SkipToContent}.tsx`
- Create : `src/lib/cn.ts`, `src/lib/fonts.ts`

**Étapes** :

1. `pnpm dlx shadcn@latest init` (config Tailwind v4, OKLCH, aliases `@/components/ui`).
2. Ajoute les primitives listées.
3. `fonts.ts` : `next/font/google` pour Fraunces (axes opsz/SOFT/wght) + Inter Tight, expose variables CSS.
4. `@theme` bind `--font-display` + `--font-body`.
5. `Header.tsx` RSC : fetch `globals.header` via Local API, render logo + nav + CTA + `LocaleSwitcher`.
6. `Footer.tsx` RSC idem pour `globals.footer`.
7. `SkipToContent` en premier focusable, `nav aria-label`.

**Vérif** :

- Home `/fr` affiche header + footer branded.
- Lighthouse a11y ≥ 95. Keyboard nav complète.
- Commit : `feat(ui): shadcn primitives + Mady header/footer with brand fonts`.

---

## Phase 5 — Pages catalogue

**Objectif** : routes `produit/[slug]`, `categorie-produit/[slug]`, pages CMS dynamiques `[...slug]`, homepage.

**Fichiers** :

- Create : `src/app/(frontend)/[locale]/page.tsx`, `src/app/(frontend)/[locale]/(pages)/[...slug]/page.tsx`, `src/app/(frontend)/[locale]/produit/[slug]/page.tsx`, `src/app/(frontend)/[locale]/categorie-produit/[slug]/page.tsx`, `src/app/(frontend)/[locale]/layout.tsx`, `src/components/product/{ProductView,SpecsTable,CertificationsList,DocumentsList,RelatedProducts}.tsx`
- Modify : `src/middleware.ts` (détection locale + redirects collection)

**Étapes** :

1. `[locale]/layout.tsx` : `generateStaticParams`, `next-intl` provider, MotionConfig.
2. Homepage : fetch `pages` where slug=`home`, render blocks via `renderer`.
3. Product page : Local API, `convertLexicalToHTMLAsync` pour description, SpecsTable en `<table>`, breadcrumbs from category nested-docs.
4. Category page : liste produits paginée, hero catégorie.
5. `[...slug]` : router générique pour pages statiques CMS.
6. ISR : `export const revalidate = 3600` par route publique.
7. `middleware.ts` : si `/` → redirige `/fr` ou `/en` selon `Accept-Language` + cookie; résout `Redirects` collection (301/302).

**Vérif** :

- Seed minimal inline (à refaire proprement phase 9) : 1 home, 1 catégorie, 2 produits.
- Navigation home → catégorie → produit → breadcrumb retour fonctionne.
- `pnpm build` succès, pas de warning dynamic/static.
- Commit : `feat(frontend): homepage + product/category pages with ISR`.

---

## Phase 6 — i18n FR/EN

**Objectif** : routing localisé subdirectories, hreflang réciproques, slugs traduits, LocaleSwitcher intelligent.

**Fichiers** :

- Create : `src/i18n/{config.ts,request.ts,routing.ts}`, `src/i18n/messages/{fr,en}.json`
- Modify : `next.config.ts`, `src/middleware.ts`, `src/components/layout/LocaleSwitcher.tsx`, toutes `generateMetadata`

**Étapes** :

1. `next-intl` setup avec routing `localePrefix: 'always'`.
2. `messages/{fr,en}.json` : clés UI (nav, CTA, labels formulaires, erreurs Zod).
3. `generateMetadata` retourne `alternates.languages` + `alternates.canonical` avec URLs fully-qualified HTTPS.
4. `LocaleSwitcher` : résout slug équivalent via mapping Payload (requête `locale: 'all'`). Si pas de trad → fallback home locale cible.
5. Middleware gère `/` → détection locale.

**Vérif** :

- `curl -I /fr/produit/echelle-crinoline` + `/en/product/crinoline-ladder` → 200, hreflang réciproques dans HTML.
- Switch FR↔EN conserve le produit courant si trad existe.
- Commit : `feat(i18n): FR/EN routing with hreflang + slug mapping`.

---

## Phase 7 — SEO + GEO

**Objectif** : différenciateur principal. Tout ce qui rend le site citable par LLM + fort en SEO classique.

**Fichiers** :

- Create : `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/app/opengraph-image.tsx`, `src/lib/schema-org.ts`, `src/lib/seo.ts`, `src/components/seo/JsonLd.tsx`, `src/app/api/revalidate/route.ts`
- Modify : pages produit/catégorie/home pour injecter JsonLd

**Étapes** :

1. `robots.ts` : bloc par bot (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, GPTBot, CCBot autorisés ; Bytespider, Diffbot bloqués). Sitemap absolu.
2. `sitemap.ts` : `generateSitemaps` chunking, `alternates.languages` par entrée, `xhtml:link`.
3. `llms.txt/route.ts` : Markdown plain, sections H2 (Produits, Fiches techniques, Normes, FAQ, Contact), généré depuis Payload.
4. `schema-org.ts` : builders typés pour `Organization`, `WebSite+SearchAction`, `Product`, `Offer`, `CollectionPage`, `BreadcrumbList`, `FAQPage`, `Article`. `@id` URIs stables, `sameAs`.
5. `JsonLd.tsx` : RSC injecte `<script type="application/ld+json">`.
6. Homepage → Organization + WebSite. Product → Product + Offer. Category → CollectionPage + Breadcrumb. Pages non-home → Breadcrumb.
7. `opengraph-image.tsx` : `ImageResponse` runtime edge, logo + titre localisé, fond brand-primary.
8. `generateMetadata` : canonical + hreflang + og.
9. `/api/revalidate` : POST avec secret header, déclenche `revalidateTag`. Hook Payload `afterChange` l'appelle.
10. Contenu : "En bref" block + answer-first paragraphes + H2 en questions, tables HTML pour specs, `dateModified` visible.

**Vérif** :

- `curl /llms.txt` → Markdown valide.
- Schema Markup Validator (schema.org) → 0 erreur sur home + 1 produit.
- Lighthouse SEO = 100.
- Commit : `feat(seo): robots + sitemap + llms.txt + JSON-LD + OG + revalidation`.

---

## Phase 8 — Formulaires

**Objectif** : Form Builder Payload côté admin, rendu RHF + Zod côté front, envoi via Server Action, rate-limit, email.

**Fichiers** :

- Create : `src/components/forms/{FormRenderer,FieldText,FieldEmail,FieldSelect,FieldCheckbox,FieldTextarea,FieldNumber}.tsx`, `src/lib/forms/{schema-from-payload.ts,submit-action.ts,rate-limit.ts}`, `src/lib/email.ts`
- Modify : `src/app/(frontend)/[locale]/contact/page.tsx`

**Étapes** :

1. `schema-from-payload.ts` : convertit form Payload → schéma Zod dynamique.
2. `FormRenderer` (client) : `useForm` + shadcn `<Form>`, render champs par type.
3. `submit-action.ts` : `'use server'`, valide Zod, POST `forms/submissions` Payload, déclenche email.
4. `rate-limit.ts` : LRU in-memory par IP (10 req / 10 min), upgradable vers Upstash plus tard.
5. `email.ts` : Resend (ou Brevo si config env présente), template React Email minimal.
6. Page contact : fetch form `contact` depuis Payload, render `FormRenderer`.

**Vérif** :

- Soumission happy path → submission visible admin + email reçu (inbox test).
- Submission invalide → erreurs Zod inline.
- Rate limit 11e submission → 429.
- Commit : `feat(forms): Payload Form Builder + RHF/Zod + server action + rate limit`.

---

## Phase 9 — Scraping & seed

**Objectif** : `pnpm scrape` récupère textes + images mady.fr, `pnpm seed` peuple Payload depuis zéro.

**Fichiers** :

- Create : `scripts/scrape-mady.ts`, `scripts/seed.ts`, `scripts/lib/{payload-local.ts,rate-limiter.ts,robots-check.ts}`, `scripts/data/{products.json,categories.json,pages.json}` (intermédiaires générés)

**Étapes** :

1. `scrape-mady.ts` : respecte `mady.fr/robots.txt` via `robots-parser`, rate-limit 1 req/s, idempotent.
2. Télécharge images produits → `scripts/assets/` (kebab-case, gitignored).
3. Extrait titres, descriptions, specs → JSON intermédiaires.
4. `seed.ts` : crée admin `admin@mady.fr` / `mady-demo-2026`, upload Media depuis `scripts/assets/`, crée 3 catégories, 6 produits spec'd (échelle crinoline, escalier droit, hélicoïdal, garde-corps, ligne de vie, saut-de-loup), pages À propos / Contact / Mentions / Confidentialité, menus header + footer, version EN home + 2 produits.
5. Idempotent : si slug existe → skip ou update.

**Vérif** :

- `docker compose down -v && docker compose up -d && pnpm seed` → site peuplé from scratch.
- Admin : 6 produits visibles, FR + EN sur home.
- Commit : `feat(scripts): scraping respectueux + seed complet Payload`.

---

## Phase 10 — Tests

**Objectif** : Vitest unit + Playwright e2e + axe + Lighthouse CI.

**Fichiers** :

- Create : `vitest.config.ts`, `playwright.config.ts`, `tests/unit/{schema-org.test.ts,seo.test.ts,forms-schema.test.ts,slug.test.ts,i18n.test.ts}`, `tests/e2e/{navigation.spec.ts,locale-switch.spec.ts,contact-form.spec.ts,product-page.spec.ts,a11y.spec.ts,schema-validation.spec.ts}`, `tests/fixtures/`

**Étapes** :

1. Vitest config : jsdom env, setup React Testing Library.
2. Unit : builders JSON-LD, helpers SEO, Zod inferés depuis Payload, utils slug/i18n.
3. Playwright config : baseURL local, 4 shards, trace on-first-retry.
4. e2e : home → catégorie → produit → contact, switch FR↔EN avec persistence, submit contact happy + invalide, JSON-LD présent et parseable.
5. Axe : `@axe-core/playwright` sur 5 routes majeures, assertion 0 violation `serious` ou `critical`.
6. Note : RSC async → ne pas tester en Vitest, couvert en e2e.

**Vérif** :

- `pnpm test` vert, coverage affichée.
- `pnpm test:e2e` vert sur runner local.
- Commit : `test: unit (Vitest) + e2e (Playwright) + axe coverage`.

---

## Phase 11 — Perf tuning + Lighthouse

**Objectif** : atteindre targets. LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, Lighthouse mobile ≥ 95 perf, 100 SEO, 100 Best Practices, ≥ 95 a11y, JS initial < 90 KB gzip.

**Fichiers** :

- Modify : blocs/pages selon findings
- Create : `docs/lighthouse.png` (capture), `scripts/analyze.ts`

**Étapes** :

1. `@next/bundle-analyzer` → identifie poids. Supprime imports inutiles.
2. Audit `'use client'` : remplace par RSC quand possible.
3. `next/image` partout, `priority` seulement au-dessus du fold.
4. `next/font` self-hosted vérifié (pas de requête Google runtime).
5. Preload hero image si LCP.
6. Lighthouse mobile sur home + produit + catégorie → capture.
7. View Transitions API pour nav pages.

**Vérif** :

- `pnpm analyze` → bundle < 90 KB.
- Lighthouse capturée dans `docs/lighthouse.png` ≥ targets.
- Commit : `perf: hit Lighthouse + CWV targets`.

---

## Phase 12 — CI + docs finales

**Objectif** : CI GitHub Actions verte, doc complète.

**Fichiers** :

- Create : `.github/workflows/ci.yml`, `docs/ARCHITECTURE.md`, update `README.md`

**Étapes** :

1. `ci.yml` : jobs parallèles `typecheck`, `biome`, `vitest`, `playwright` (4 shards), `lighthouse` (treosh/lighthouse-ci-action@v12 sur preview Vercel).
2. Matrix Node 22. Cache pnpm store + Playwright browsers.
3. `ARCHITECTURE.md` (1 page max) : découpage blocks/collections + décisions de stack + gotchas Payload/Next.
4. `README.md` final : setup (docker + pnpm + seed), commandes (`dev`, `build`, `seed`, `scrape`, `test`, `test:e2e`, `lint`, `typecheck`, `analyze`), variables d'env, checklist déploiement (Vercel+Neon POC / Hetzner+Coolify prod).

**Vérif** :

- Push branche → CI verte.
- Tous critères "Définition de terminé" (prompt §640-651) cochés.
- Commit : `docs: architecture + README setup + CI workflow`.

---

## Trade-offs tranchés (exposés pour validation)

1. **Next 15.5 plutôt que 16.2** : LTS oct 2026, écosystème stable, moins de risque Payload/shadcn breakage. Next 16 ok si le repo doit vivre 2+ ans — à confirmer.
2. **Postgres Docker dev + Neon POC + VPS Hetzner prod** : matche le prompt, évite vendor lock Vercel. Neon connection pooled obligatoire.
3. **Pas de PPR / cacheComponents / dynamicIO** : incompatibles admin Payload, bugs connus (gotcha §1 prompt).
4. **Biome seul, pas d'ESLint/Prettier** : accepte perte de 2-3 règles Next (couvertes par revue).
5. **Email Resend par défaut** : fallback Brevo si éditrice a déjà un compte. Décidé au seed.
6. **Rate-limit in-memory LRU** : suffisant POC, Upstash si trafic réel.
7. **Tests RSC async en e2e uniquement** : Vitest ne supporte pas, documenté dans ARCHITECTURE.md.

---

## Definition of Done (rappel prompt)

- [ ] `pnpm typecheck` → 0 erreur
- [ ] `pnpm exec biome ci .` → 0 erreur, 0 warning
- [ ] `pnpm test` → tous verts
- [ ] `pnpm test:e2e` → tous verts, 0 violation axe sérieuse
- [ ] `pnpm build` → succès, aucun warning Next
- [ ] Lighthouse mobile ≥ targets (capture `docs/lighthouse.png`)
- [ ] Aucun `lorem ipsum` / placeholder
- [ ] README à jour
- [ ] `llms.txt` + `robots.txt` + sitemap multilingue accessibles
- [ ] JSON-LD valide sur chaque page (Schema Markup Validator)

---

**Validation requise avant Phase 0.** Répondre :

- GO global ou ajustements ?
- Version Next 15.5 confirmée ou pivot 16.2 ?
- Resend ok pour email ou Brevo ?
- Worktree git à créer ou travail direct sur `main` ?
