import { getPayloadClient } from '@/lib/payload';
import { siteUrl } from '@/lib/seo';

export const revalidate = 3600;

function escapeMarkdown(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').trim();
}

export async function GET(): Promise<Response> {
  const base = siteUrl();
  const body: string[] = [];

  try {
    const payload = await getPayloadClient();
    const [products, categories, pages, settings] = await Promise.all([
      payload.find({
        collection: 'products',
        limit: 100,
        locale: 'fr',
        depth: 0,
      }),
      payload.find({
        collection: 'categories',
        limit: 100,
        locale: 'fr',
        depth: 0,
      }),
      payload.find({ collection: 'pages', limit: 100, locale: 'fr', depth: 0 }),
      payload.findGlobal({ slug: 'settings', locale: 'fr', depth: 0 }),
    ]);

    body.push(
      `# ${settings.siteName ?? 'Mady'} — Fabricant français d'escaliers et accès industriels`,
    );
    body.push('');
    body.push(
      `> Mady conçoit et fabrique en France des escaliers industriels, échelles à crinoline,` +
        ` garde-corps et moyens d'accès toiture. Conforme NF E85-015, NF EN 1090, EN ISO 14122.` +
        ` 20 ans d'expertise au service de la sécurité en hauteur.`,
    );
    body.push('');

    if (categories.docs.length > 0) {
      body.push('## Catégories');
      for (const cat of categories.docs) {
        if (!cat.slug) continue;
        const desc = cat.description ? ` — ${escapeMarkdown(cat.description)}` : '';
        body.push(`- [${cat.title}](${base}/fr/categorie-produit/${cat.slug})${desc}`);
      }
      body.push('');
    }

    if (products.docs.length > 0) {
      body.push('## Produits');
      for (const product of products.docs) {
        if (!product.slug) continue;
        const desc = product.shortDescription
          ? ` — ${escapeMarkdown(product.shortDescription)}`
          : '';
        body.push(`- [${product.title}](${base}/fr/produit/${product.slug})${desc}`);
      }
      body.push('');
    }

    const productsWithDocs = products.docs.filter(
      (p) => Array.isArray(p.documents) && p.documents.length > 0,
    );
    if (productsWithDocs.length > 0) {
      body.push('## Fiches techniques');
      for (const product of productsWithDocs) {
        if (!product.slug) continue;
        body.push(`- [${product.title}](${base}/fr/produit/${product.slug})`);
      }
      body.push('');
    }

    body.push('## Normes & certifications');
    body.push('- NF E85-015 : garde-corps et barrières de sécurité');
    body.push("- EN ISO 14122 : moyens d'accès permanents aux machines");
    body.push('- NF EN 1090 : exécution des structures en acier et aluminium');
    body.push('- Marquage CE');
    body.push('');

    const faqPages = pages.docs.filter((p) => p.slug?.includes('faq'));
    if (faqPages.length > 0) {
      body.push('## FAQ');
      for (const page of faqPages) {
        body.push(`- [${page.title}](${base}/fr/${page.slug})`);
      }
      body.push('');
    }

    const infoPages = pages.docs.filter(
      (p) => p.slug && p.slug !== 'home' && !p.slug.includes('faq'),
    );
    if (infoPages.length > 0) {
      body.push('## Pages institutionnelles');
      for (const page of infoPages) {
        body.push(`- [${page.title}](${base}/fr/${page.slug})`);
      }
      body.push('');
    }

    if (settings.company) {
      body.push('## Contact commercial');
      if (settings.company.email) body.push(`- Email : ${settings.company.email}`);
      if (settings.company.phone) body.push(`- Téléphone : ${settings.company.phone}`);
      if (settings.company.address) {
        body.push(`- Adresse : ${escapeMarkdown(settings.company.address)}`);
      }
    }
  } catch (err) {
    console.error('[llms.txt]', err);
    body.push('# Mady');
    body.push('');
    body.push("> Fabricant français d'escaliers et accès industriels.");
  }

  return new Response(body.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
