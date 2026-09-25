import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HomePage, { generateMetadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn(),
  getCachedCategories: vi.fn(),
  getCachedCatalog: vi.fn()
}));

import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import { type CategoryTreeItem, DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import type { Store } from '@hh/db';

describe('Storefront Homepage (/page.tsx) - Performance & Edge Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders storefront initializing screen when flagship store is not seeded', async () => {
    vi.mocked(getCachedStore).mockResolvedValue(null);

    const page = await HomePage({ searchParams: Promise.resolve({}) });
    render(page);

    expect(screen.getByText('Storefront Initializing')).toBeDefined();
    expect(screen.getByText(/Please run the database seed script/)).toBeDefined();
  });

  it('renders the luxury collection catalog when store and products are resolved', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      slug: 'hh',
      name: 'H&H Luxury Modest Wear',
      settings: {
        instagramHandle: 'handh_official',
        storefront: {
          announcement: { enabled: true, text: 'Complimentary shipping across India' },
          hero: { headline: 'Artisanal Luxury', subheadline: 'Handcrafted with reverence' },
          theme: {}
        }
      }
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([
      {
        id: 'cat-1',
        slug: 'pins',
        name: 'Modesty Pins',
        sortOrder: 1,
        subcategories: []
      }
    ] as unknown as CategoryTreeItem[]);

    vi.mocked(getCachedCatalog).mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'royal-abaya-pin',
        title: 'Royal Emerald Abaya Pin',
        startingPriceMinor: 89900,
        currency: 'INR',
        primaryImageUrl: 'https://images.handh.local/pin-1.jpg',
        categoryName: 'Modesty Pins',
        isAvailable: true
      }
    ]);

    const page = await HomePage({ searchParams: Promise.resolve({ category: 'pins' }) });
    render(page);

    // Main section headers
    expect(screen.getByText('The Collection')).toBeDefined();
    expect(screen.getByText('Artisanal Curation')).toBeDefined();

    // Product Card rendered from cached catalog
    expect(screen.getByText('Royal Emerald Abaya Pin')).toBeDefined();
    expect(screen.getByText(/899/)).toBeDefined();
    expect(screen.getByText('MRP (incl. taxes)')).toBeDefined();

    // Invocations of cached data layer
    expect(getCachedStore).toHaveBeenCalledWith('hh');
    expect(getCachedCategories).toHaveBeenCalledWith('store-1');
    expect(getCachedCatalog).toHaveBeenCalledWith('store-1', 'pins');
  });

  it('renders empty collection view when no products match active category', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      slug: 'hh',
      name: 'H&H',
      settings: { storefront: {} }
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([]);
    vi.mocked(getCachedCatalog).mockResolvedValue([]);

    const page = await HomePage({ searchParams: Promise.resolve({ category: 'scarves' }) });
    render(page);

    expect(screen.getByText('No pieces are currently cataloged in this collection.')).toBeDefined();
  });

  it('exports generateMetadata generating rich OpenGraph and canonical tags', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      slug: 'hh',
      name: 'H&H Luxury Modest Wear',
      settings: {}
    } as unknown as Store);

    const meta = await generateMetadata();

    expect(meta.title).toBe(`H&H Luxury Modest Wear — ${DEFAULT_BRAND_IDENTITY.subtitle}`);
    expect(meta.description).toBe(DEFAULT_BRAND_IDENTITY.description);
    expect(meta.openGraph?.siteName).toBe('H&H Luxury Modest Wear');
    expect(meta.alternates?.canonical).toBe(DEFAULT_BRAND_IDENTITY.websiteUrl);
  });

  it('injects Schema.org JSON-LD structured data script on homepage (E-COM-151)', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      slug: 'hh',
      name: 'H&H',
      settings: {
        storefront: {
          hero: { subtitle: 'Refined handcrafted artisanal jewelry.' }
        }
      }
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([]);
    vi.mocked(getCachedCatalog).mockResolvedValue([]);

    const { container } = render(await HomePage({ searchParams: Promise.resolve({}) }));

    const jsonLdScript = container.querySelector('script[type="application/ld+json"]');
    expect(jsonLdScript).not.toBeNull();
    const content = JSON.parse(jsonLdScript?.textContent || '{}');
    expect(content['@context']).toBe('https://schema.org');
    expect(content['@graph'][0]['@type']).toBe('WebSite');
    expect(content['@graph'][1]['@type']).toBe('JewelryStore');
    expect(content['@graph'][1]['name']).toBe('H&H');
  });
});
