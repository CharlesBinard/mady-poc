import { describe, expect, it } from 'vitest';
import { buildAlternates, siteUrl } from '../../src/lib/seo';

describe('buildAlternates', () => {
  it('emits canonical + reciprocal hreflang + x-default', () => {
    const a = buildAlternates('fr', '/produit/echelle');
    const base = siteUrl();
    expect(a.canonical).toBe(`${base}/fr/produit/echelle`);
    expect(a.languages.fr).toBe(`${base}/fr/produit/echelle`);
    expect(a.languages.en).toBe(`${base}/en/produit/echelle`);
    expect(a.languages['x-default']).toBe(`${base}/fr/produit/echelle`);
  });

  it('handles home path without trailing slash', () => {
    const a = buildAlternates('en', '/');
    const base = siteUrl();
    expect(a.canonical).toBe(`${base}/en`);
    expect(a.languages.fr).toBe(`${base}/fr`);
    expect(a.languages['x-default']).toBe(`${base}/fr`);
  });
});
