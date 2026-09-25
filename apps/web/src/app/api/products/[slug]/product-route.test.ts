import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedProduct, getCachedStore } from '@/lib/catalog-cache';

import type { Store } from '@hh/db';
import type { PublicProductDetail } from '@hh/domain';

import { GET } from './route';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn(),
  getCachedProduct: vi.fn()
}));

describe('Product Detail API Route (/api/products/[slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when store cannot be found', async () => {
    vi.mocked(getCachedStore).mockResolvedValueOnce(null);

    const res = await GET(new Request('http://localhost:3000/api/products/sample-abaya'), {
      params: Promise.resolve({ slug: 'sample-abaya' })
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Store not found');
  });

  it('returns 404 when product is not found', async () => {
    vi.mocked(getCachedStore).mockResolvedValueOnce({
      id: 'store-1',
      name: 'H&H'
    } as unknown as Store);
    vi.mocked(getCachedProduct).mockResolvedValueOnce(null);

    const res = await GET(new Request('http://localhost:3000/api/products/unknown'), {
      params: Promise.resolve({ slug: 'unknown' })
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Product not found');
  });

  it('returns 200 with product data when found', async () => {
    const mockProduct = {
      id: 'prod-1',
      slug: 'silk-abaya',
      title: 'Silk Abaya',
      variants: [{ id: 'var-1', title: 'Default', priceMinor: 499900 }]
    };

    vi.mocked(getCachedStore).mockResolvedValueOnce({
      id: 'store-1',
      name: 'H&H'
    } as unknown as Store);
    vi.mocked(getCachedProduct).mockResolvedValueOnce(
      mockProduct as unknown as PublicProductDetail
    );

    const res = await GET(new Request('http://localhost:3000/api/products/silk-abaya'), {
      params: Promise.resolve({ slug: 'silk-abaya' })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(mockProduct);
  });
});
