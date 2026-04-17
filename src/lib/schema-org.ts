import type { AppLocale } from '@/i18n/routing';
import type { Category, Product, Setting } from '@/payload-types';
import { siteUrl } from './seo';

interface JsonLdNode {
  '@context'?: string;
  '@type': string | string[];
  '@id'?: string;
  [key: string]: unknown;
}

export function organizationSchema(settings: Setting): JsonLdNode {
  const base = siteUrl();
  const company = settings.company ?? {};
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'Manufacturer'],
    '@id': `${base}/#organization`,
    name: settings.siteName ?? 'Mady',
    url: base,
    logo: `${base}/brand/logo-mady.png`,
    description: settings.baseline ?? undefined,
    email: company.email ?? undefined,
    telephone: company.phone ?? undefined,
    taxID: company.siret ?? undefined,
    vatID: company.vat ?? undefined,
    address: company.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: company.address,
          addressCountry: 'FR',
        }
      : undefined,
  };
}

export function websiteSchema(locale: AppLocale): JsonLdNode {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: `${base}/${locale}`,
    inLanguage: locale,
    publisher: { '@id': `${base}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

const CERT_LABELS: Record<string, string> = {
  'nf-e85-015': 'NF E85-015',
  'en-iso-14122': 'EN ISO 14122',
  ce: 'CE',
  'nf-en-1090': 'NF EN 1090',
};

export function productSchema(product: Product, locale: AppLocale): JsonLdNode {
  const base = siteUrl();
  const category =
    product.category && typeof product.category === 'object' ? product.category : null;

  const images = (product.gallery ?? [])
    .map((entry) => (typeof entry.image === 'object' ? entry.image : null))
    .filter((m): m is NonNullable<typeof m> => Boolean(m?.url))
    .map((m) => m.url);

  const specs = (product.specifications ?? []).map((s) => ({
    '@type': 'PropertyValue',
    name: s.label,
    value: s.value,
  }));

  const certs = (product.certifications ?? []).map((cert) => ({
    '@type': 'Certification',
    name: CERT_LABELS[cert] ?? cert,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${base}/${locale}/produit/${product.slug}#product`,
    name: product.title,
    sku: product.reference,
    mpn: product.reference,
    description: product.shortDescription ?? undefined,
    image: images.length > 0 ? images : undefined,
    category: category?.title,
    brand: { '@type': 'Brand', name: 'Mady' },
    manufacturer: { '@id': `${base}/#organization` },
    ...(specs.length > 0 ? { additionalProperty: specs } : {}),
    ...(certs.length > 0 ? { hasCertification: certs } : {}),
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/MadeToOrder',
      priceCurrency: 'EUR',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: 'EUR',
        description: 'Sur devis',
      },
      url: `${base}/${locale}/produit/${product.slug}`,
      seller: { '@id': `${base}/#organization` },
    },
  };
}

export function categorySchema(
  category: Category,
  products: Product[],
  locale: AppLocale,
): JsonLdNode {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${base}/${locale}/categorie-produit/${category.slug}#collection`,
    name: category.title,
    description: category.description ?? undefined,
    url: `${base}/${locale}/categorie-produit/${category.slug}`,
    isPartOf: { '@id': `${base}/#website` },
    hasPart: products.map((p) => ({
      '@type': 'Product',
      '@id': `${base}/${locale}/produit/${p.slug}#product`,
      name: p.title,
      url: `${base}/${locale}/produit/${p.slug}`,
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url?: string | undefined }[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
