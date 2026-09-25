import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as catalogCache from '@/lib/catalog-cache';

import { GET } from './route';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn(),
  getCachedCatalog: vi.fn(),
  getCachedCategories: vi.fn()
}));

describe('Search API Route (GET /api/search)', () => {
  const mockStore = { id: 'store-1', name: 'The Haya Collection', slug: 'hh' };
  const mockProducts = [
    {
      id: 'p-1',
      slug: 'classic-black-silk-abaya',
      title: 'Classic Black Silk Abaya',
      department: 'Abayas',
      tags: ['silk', 'black', 'modest'],
      categoryName: 'Abayas',
      startingPriceMinor: 499900,
      currency: 'INR',
      primaryImageUrl: '/images/abaya1.jpg'
    },
    {
      id: 'p-2',
      slug: 'vintage-gold-filigree-ring',
      title: 'Vintage Gold Filigree Ring',
      department: 'Jewelry',
      tags: ['gold', 'ring'],
      categoryName: 'Jewelry',
      startingPriceMinor: 129900,
      currency: 'INR',
      primaryImageUrl: '/images/ring.jpg'
    }
  ];

  const mockCategories = [
    { id: 'c-1', name: 'Abayas & Modest Wear', slug: 'abayas' },
    { id: 'c-2', name: 'Fine Jewelry', slug: 'jewelry' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(catalogCache.getCachedStore).mockResolvedValue(
      mockStore as unknown as Awaited<ReturnType<typeof catalogCache.getCachedStore>>
    );
    vi.mocked(catalogCache.getCachedCatalog).mockResolvedValue(
      mockProducts as unknown as Awaited<ReturnType<typeof catalogCache.getCachedCatalog>>
    );
    vi.mocked(catalogCache.getCachedCategories).mockResolvedValue(
      mockCategories as unknown as Awaited<ReturnType<typeof catalogCache.getCachedCategories>>
    );
  });

  it('returns empty results when query is empty or whitespace', async () => {
    const req = new Request('http://localhost/api/search?q=  ');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.categories).toEqual([]);
    expect(catalogCache.getCachedCatalog).not.toHaveBeenCalled();
  });

  it('returns filtered products and categories matching query', async () => {
    const req = new Request('http://localhost/api/search?q=abaya');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0].slug).toBe('classic-black-silk-abaya');
    expect(body.categories).toHaveLength(1);
    expect(body.categories[0].slug).toBe('abayas');
  });

  it('matches products by tags as well', async () => {
    const req = new Request('http://localhost/api/search?q=gold');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0].slug).toBe('vintage-gold-filigree-ring');
  });

  it('returns 503 when store is not found', async () => {
    vi.mocked(catalogCache.getCachedStore).mockResolvedValue(null);
    const req = new Request('http://localhost/api/search?q=ring');
    const res = await GET(req);
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.error).toContain('Storefront unavailable');
  });
});
