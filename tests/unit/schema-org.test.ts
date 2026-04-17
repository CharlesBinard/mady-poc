import { describe, expect, it } from 'vitest';
import {
  breadcrumbSchema,
  categorySchema,
  organizationSchema,
  productSchema,
  websiteSchema,
} from '../../src/lib/schema-org';
import type { Category, Product, Setting } from '../../src/payload-types';

const baseSettings: Setting = {
  id: 1,
  siteName: 'Mady',
  baseline: 'Fabricant français',
  company: { legalName: 'Mady SAS', email: 'contact@mady.fr' },
  updatedAt: '2026-04-17T00:00:00Z',
  createdAt: '2026-04-17T00:00:00Z',
} as unknown as Setting;

const baseProduct: Product = {
  id: 42,
  title: 'Échelle à crinoline',
  slug: 'echelle-crinoline',
  reference: 'MAD-ECR-001',
  shortDescription: 'Échelle verticale avec crinoline.',
  specifications: [{ label: 'Hauteur', value: '10 m' }],
  certifications: ['en-iso-14122', 'ce'],
  category: 1,
  gallery: [],
  _status: 'published',
  updatedAt: '2026-04-17T00:00:00Z',
  createdAt: '2026-04-17T00:00:00Z',
} as unknown as Product;

const baseCategory: Category = {
  id: 1,
  title: "Moyens d'accès",
  slug: 'moyens-acces',
  description: 'Accès sécurisés',
  updatedAt: '2026-04-17T00:00:00Z',
  createdAt: '2026-04-17T00:00:00Z',
} as unknown as Category;

describe('organizationSchema', () => {
  it('emits Organization + Manufacturer with stable @id', () => {
    const s = organizationSchema(baseSettings);
    expect(s['@type']).toEqual(['Organization', 'Manufacturer']);
    expect(s['@id']).toContain('#organization');
    expect(s.name).toBe('Mady');
    expect(s.email).toBe('contact@mady.fr');
  });
});

describe('websiteSchema', () => {
  it('includes SearchAction potentialAction and publisher reference', () => {
    const s = websiteSchema('fr');
    expect(s['@type']).toBe('WebSite');
    expect(s.inLanguage).toBe('fr');
    expect((s.publisher as { '@id': string })['@id']).toContain('#organization');
    expect((s.potentialAction as { '@type': string })['@type']).toBe('SearchAction');
  });
});

describe('productSchema', () => {
  it('includes PropertyValue specs and MadeToOrder Offer', () => {
    const s = productSchema(baseProduct, 'fr');
    expect(s['@type']).toBe('Product');
    expect(s.sku).toBe('MAD-ECR-001');
    const offers = s.offers as {
      availability: string;
      priceSpecification: { description: string };
    };
    expect(offers.availability).toBe('https://schema.org/MadeToOrder');
    expect(offers.priceSpecification.description).toBe('Sur devis');
    const specs = s.additionalProperty as { '@type': string; name: string }[];
    expect(specs[0]?.['@type']).toBe('PropertyValue');
  });

  it('renders Certification objects', () => {
    const s = productSchema(baseProduct, 'fr');
    const certs = s.hasCertification as { '@type': string; name: string }[];
    expect(certs[0]?.['@type']).toBe('Certification');
    expect(certs.map((c) => c.name)).toContain('EN ISO 14122');
  });
});

describe('categorySchema', () => {
  it('cross-references products by stable @id', () => {
    const s = categorySchema(baseCategory, [baseProduct], 'fr');
    expect(s['@type']).toBe('CollectionPage');
    const parts = s.hasPart as { '@id': string }[];
    expect(parts[0]?.['@id']).toBe('http://localhost:3000/fr/produit/echelle-crinoline#product');
  });
});

describe('breadcrumbSchema', () => {
  it('emits ordered ListItem entries with optional item', () => {
    const s = breadcrumbSchema([
      { name: 'Accueil', url: 'https://mady.fr/fr' },
      { name: 'Produit' },
    ]);
    const items = s.itemListElement as {
      position: number;
      item?: string;
      name: string;
    }[];
    expect(items[0]?.position).toBe(1);
    expect(items[0]?.item).toBe('https://mady.fr/fr');
    expect(items[1]?.item).toBeUndefined();
  });
});
