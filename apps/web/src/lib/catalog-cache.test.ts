import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as redisModule from '@/lib/redis';

import type { Redis } from 'ioredis';

import * as dbModule from '@hh/db';

import type { Store } from '@hh/db';
import type { CategoryTreeItem, PublicProductDetail, PublicProductListItem } from '@hh/domain';

import {
  clearInFlightPromisesForTesting,
  getCachedCatalog,
  getCachedCategories,
  getCachedProduct,
  getCachedStore,
  getOrSetRedisCache,
  invalidateCatalogCache,
  NEGATIVE_CACHE_SENTINEL,
  NEGATIVE_CACHE_TTL,
  safeRevalidatePath,
  safeRevalidateTag
} from './catalog-cache';

vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn(),
  getCategoryTree: vi.fn(),
  listPublishedProducts: vi.fn(),
  findProductBySlug: vi.fn()
}));

describe('Catalog Cache & Edge Invalidation Service (E-COM-030, E-COM-116)', () => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(),
    del: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearInFlightPromisesForTesting();
  });

  describe('getOrSetRedisCache', () => {
    it('returns cached value from Redis when available without calling fetcher', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockResolvedValue(JSON.stringify({ title: 'Cached Pin' }));

      const fetcher = vi.fn();
      const result = await getOrSetRedisCache('catalog:item', 60, fetcher);

      expect(result).toEqual({ title: 'Cached Pin' });
      expect(mockRedis.get).toHaveBeenCalledWith('catalog:item');
      expect(fetcher).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('calls fetcher and writes to Redis on cache miss', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const fetcher = vi.fn().mockResolvedValue({ id: 'prod-123', price: 999 });
      const result = await getOrSetRedisCache('catalog:product:prod-123', 120, fetcher);

      expect(result).toEqual({ id: 'prod-123', price: 999 });
      expect(fetcher).toHaveBeenCalledOnce();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'catalog:product:prod-123',
        JSON.stringify({ id: 'prod-123', price: 999 }),
        'EX',
        120
      );
    });

    it('deduplicates concurrent cache misses with single-flight stampede defense (E-COM-135)', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      let resolveSlowFetcher: (value: { id: string }) => void = () => {};
      const slowPromise = new Promise<{ id: string }>((resolve) => {
        resolveSlowFetcher = resolve;
      });
      const fetcher = vi.fn().mockImplementation(() => slowPromise);

      // Launch 5 simultaneous requests for the identical cache key
      const [req1, req2, req3, req4, req5] = [
        getOrSetRedisCache('catalog:product:stampede-test', 60, fetcher),
        getOrSetRedisCache('catalog:product:stampede-test', 60, fetcher),
        getOrSetRedisCache('catalog:product:stampede-test', 60, fetcher),
        getOrSetRedisCache('catalog:product:stampede-test', 60, fetcher),
        getOrSetRedisCache('catalog:product:stampede-test', 60, fetcher)
      ];

      // Resolve the single database operation
      resolveSlowFetcher({ id: 'prod-single-flight' });

      const results = await Promise.all([req1, req2, req3, req4, req5]);

      // All 5 callers get the exact same resolved value
      expect(results).toEqual([
        { id: 'prod-single-flight' },
        { id: 'prod-single-flight' },
        { id: 'prod-single-flight' },
        { id: 'prod-single-flight' },
        { id: 'prod-single-flight' }
      ]);

      // Database fetcher was invoked exactly once across all 5 callers!
      expect(fetcher).toHaveBeenCalledOnce();
    });

    it('stores negative cache sentinel on 404/null to prevent DB exhaustion (E-COM-135)', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const fetcher = vi.fn().mockResolvedValue(null);
      const result = await getOrSetRedisCache('catalog:product:non-existent', 60, fetcher);

      expect(result).toBeNull();
      expect(fetcher).toHaveBeenCalledOnce();
      expect(mockRedis.set).toHaveBeenCalledWith(
        'catalog:product:non-existent',
        NEGATIVE_CACHE_SENTINEL,
        'EX',
        NEGATIVE_CACHE_TTL
      );
    });

    it('returns null directly when Redis contains negative cache sentinel without calling DB (E-COM-135)', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockResolvedValue(NEGATIVE_CACHE_SENTINEL);

      const fetcher = vi.fn();
      const result = await getOrSetRedisCache('catalog:product:non-existent', 60, fetcher);

      expect(result).toBeNull();
      expect(fetcher).not.toHaveBeenCalled();
      expect(mockRedis.set).not.toHaveBeenCalled();
    });

    it('gracefully degrades to fetcher when Redis is null', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(null);

      const fetcher = vi.fn().mockResolvedValue('direct-db-result');
      const result = await getOrSetRedisCache('catalog:any', 60, fetcher);

      expect(result).toBe('direct-db-result');
      expect(fetcher).toHaveBeenCalledOnce();
    });

    it('gracefully degrades to fetcher when Redis throws an error', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.get.mockRejectedValue(new Error('Connection lost'));

      const fetcher = vi.fn().mockResolvedValue({ data: 'recovered' });
      const result = await getOrSetRedisCache('catalog:error-test', 60, fetcher);

      expect(result).toEqual({ data: 'recovered' });
      expect(fetcher).toHaveBeenCalledOnce();
    });
  });

  describe('safeRevalidateTag and safeRevalidatePath', () => {
    it('executes safeRevalidateTag without throwing when next/cache throws', () => {
      expect(() => safeRevalidateTag('catalog')).not.toThrow();
    });

    it('executes safeRevalidatePath without throwing when next/cache throws', () => {
      expect(() => safeRevalidatePath('/products/item', 'page')).not.toThrow();
      expect(() => safeRevalidatePath('/', 'layout')).not.toThrow();
    });
  });

  describe('invalidateCatalogCache', () => {
    it('purges Redis catalog keys and handles empty keys array gracefully', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.keys.mockResolvedValue(['catalog:products:hh:all', 'catalog:categories:hh']);
      mockRedis.del.mockResolvedValue(2);

      await invalidateCatalogCache();

      expect(mockRedis.keys).toHaveBeenCalledWith('catalog:*');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'catalog:products:hh:all',
        'catalog:categories:hh'
      );
    });

    it('purges specific product slug pattern when slug option is passed', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.keys.mockResolvedValue(['catalog:product:hh:royal-abaya-pin']);
      mockRedis.del.mockResolvedValue(1);

      await invalidateCatalogCache({ slug: 'royal-abaya-pin' });

      expect(mockRedis.keys).toHaveBeenCalledWith('catalog:*royal-abaya-pin*');
      expect(mockRedis.del).toHaveBeenCalledWith('catalog:product:hh:royal-abaya-pin');
    });

    it('handles Redis failure during invalidation without throwing', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(mockRedis as unknown as Redis);
      mockRedis.keys.mockRejectedValue(new Error('Redis timeout'));

      await expect(invalidateCatalogCache()).resolves.toBeUndefined();
    });
  });

  describe('Storefront Data Resolvers', () => {
    it('resolves store by slug with caching', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(null);
      vi.mocked(dbModule.findStoreBySlug).mockResolvedValue({
        id: 'store-1',
        slug: 'hh',
        name: 'H&H Flagship'
      } as unknown as Store);

      const store = await getCachedStore('hh');
      expect(store?.name).toBe('H&H Flagship');
      expect(dbModule.findStoreBySlug).toHaveBeenCalledWith(expect.anything(), 'hh');
    });

    it('resolves categories with caching', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(null);
      vi.mocked(dbModule.getCategoryTree).mockResolvedValue([
        { id: 'cat-1', slug: 'pins', name: 'Pins', subcategories: [] }
      ] as unknown as CategoryTreeItem[]);

      const categories = await getCachedCategories('store-1');
      expect(categories.length).toBe(1);
      expect(categories[0]?.slug).toBe('pins');
    });

    it('resolves published catalog with caching', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(null);
      vi.mocked(dbModule.listPublishedProducts).mockResolvedValue([
        {
          id: 'prod-1',
          slug: 'gold-pin',
          title: 'Gold Pin',
          startingPriceMinor: 29900,
          currency: 'INR',
          primaryImageUrl: null,
          categoryName: 'Pins',
          isAvailable: true
        }
      ] as unknown as PublicProductListItem[]);

      const catalog = await getCachedCatalog('store-1', 'pins');
      expect(catalog.length).toBe(1);
      expect(catalog[0]?.startingPriceMinor).toBe(29900);
      expect(dbModule.listPublishedProducts).toHaveBeenCalledWith(expect.anything(), 'store-1', {
        categorySlug: 'pins'
      });
    });

    it('resolves product detail with caching', async () => {
      vi.mocked(redisModule.getRedisClient).mockReturnValue(null);
      vi.mocked(dbModule.findProductBySlug).mockResolvedValue({
        id: 'prod-1',
        slug: 'gold-pin',
        title: 'Gold Pin',
        description: 'Luxury pin',
        variants: [],
        images: []
      } as unknown as PublicProductDetail);

      const product = await getCachedProduct('store-1', 'gold-pin');
      expect(product?.title).toBe('Gold Pin');
      expect(dbModule.findProductBySlug).toHaveBeenCalledWith(
        expect.anything(),
        'store-1',
        'gold-pin'
      );
    });
  });
});
