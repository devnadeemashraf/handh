import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getRedisClient } from '@/lib/redis';

import {
  findProductBySlug,
  findStoreBySlug,
  getCategoryTree,
  getSharedDbClient,
  listPublishedProducts,
  type Store
} from '@hh/db';

import type { CategoryTreeItem, PublicProductDetail, PublicProductListItem } from '@hh/domain';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

/**
 * Cache TTL configuration in seconds for catalog data.
 */
export const CATALOG_CACHE_TTL = {
  STORE: 300, // 5 minutes
  CATEGORIES: 300, // 5 minutes
  CATALOG: 60, // 1 minute
  PRODUCT: 60 // 1 minute
} as const;

/**
 * Resilient Redis cache-aside helper with automatic JSON serialization and graceful degradation.
 */
export async function getOrSetRedisCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis read failure; fall through to database fetcher
    }
  }

  const result = await fetcher();

  if (redis && result !== null && result !== undefined) {
    try {
      await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
    } catch {
      // Redis write failure is non-fatal
    }
  }

  return result;
}

/**
 * Safely calls Next.js revalidateTag without throwing when invoked outside a Next.js request context (e.g. unit tests).
 */
export function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag);
  } catch {
    // Gracefully ignore outside Next.js request context
  }
}

/**
 * Safely calls Next.js revalidatePath without throwing when invoked outside a Next.js request context.
 */
export function safeRevalidatePath(path: string, type?: 'layout' | 'page'): void {
  try {
    revalidatePath(path, type);
  } catch {
    // Gracefully ignore outside Next.js request context
  }
}

/**
 * Wraps a fetcher with Next.js unstable_cache when in production/dev, or transparently delegates to the function in test.
 */
function withNextCache<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyParts: string[],
  options: { revalidate?: number; tags?: string[] }
): (...args: Args) => Promise<T> {
  if (process.env.NODE_ENV === 'test') {
    return fn;
  }
  return unstable_cache(fn, keyParts, options);
}

/**
 * Resolves store details directly from the database, bypassing all caches.
 * Used during Draft Mode preview to guarantee zero-latency visibility of SDUI updates.
 */
export async function getFreshStore(slug: string = 'hh'): Promise<Store | null> {
  const db = getDatabase();
  return findStoreBySlug(db, slug);
}

/**
 * Resolves store details by slug with Redis caching and Next.js ISR edge caching.
 */
export const getCachedStore = cache(
  withNextCache(
    async (slug: string = 'hh'): Promise<Store | null> => {
      const db = getDatabase();
      return getOrSetRedisCache(`catalog:store:${slug}`, CATALOG_CACHE_TTL.STORE, () =>
        findStoreBySlug(db, slug)
      );
    },
    ['catalog-store'],
    { revalidate: CATALOG_CACHE_TTL.STORE, tags: ['storefront', 'catalog'] }
  )
);

/**
 * Resolves the hierarchical category tree with Redis caching and Next.js ISR edge caching.
 */
export const getCachedCategories = cache(
  withNextCache(
    async (storeId: string): Promise<CategoryTreeItem[]> => {
      const db = getDatabase();
      return getOrSetRedisCache(`catalog:categories:${storeId}`, CATALOG_CACHE_TTL.CATEGORIES, () =>
        getCategoryTree(db, storeId)
      );
    },
    ['catalog-categories'],
    { revalidate: CATALOG_CACHE_TTL.CATEGORIES, tags: ['catalog', 'categories'] }
  )
);

/**
 * Resolves published products with Redis caching, Next.js ISR edge caching, and single-query execution.
 */
export const getCachedCatalog = cache(
  withNextCache(
    async (storeId: string, categorySlug?: string): Promise<PublicProductListItem[]> => {
      const db = getDatabase();
      return getOrSetRedisCache(
        `catalog:products:${storeId}:${categorySlug ?? 'all'}`,
        CATALOG_CACHE_TTL.CATALOG,
        () => listPublishedProducts(db, storeId, categorySlug ? { categorySlug } : {})
      );
    },
    ['catalog-products'],
    { revalidate: CATALOG_CACHE_TTL.CATALOG, tags: ['catalog'] }
  )
);

/**
 * Resolves product detail by slug with Redis caching, Next.js ISR edge caching, and request-level deduplication.
 */
export const getCachedProduct = cache(
  withNextCache(
    async (storeId: string, slug: string): Promise<PublicProductDetail | null> => {
      const db = getDatabase();
      return getOrSetRedisCache(
        `catalog:product:${storeId}:${slug}`,
        CATALOG_CACHE_TTL.PRODUCT,
        () => findProductBySlug(db, storeId, slug)
      );
    },
    ['catalog-product-detail'],
    { revalidate: CATALOG_CACHE_TTL.PRODUCT, tags: ['catalog', 'product'] }
  )
);

/**
 * Flushes Redis catalog cache keys and triggers on-demand Next.js cache revalidation.
 */
export async function invalidateCatalogCache(options?: {
  slug?: string;
  storeId?: string;
}): Promise<void> {
  // 1. Next.js on-demand cache revalidation
  safeRevalidateTag('catalog');
  safeRevalidateTag('storefront');
  if (options?.slug) {
    safeRevalidateTag(`product:${options.slug}`);
    safeRevalidatePath(`/products/${options.slug}`, 'page');
  }
  safeRevalidatePath('/', 'layout');

  // 2. Redis cache invalidation
  const redis = getRedisClient();
  if (redis) {
    try {
      if (options?.slug) {
        const pattern = `catalog:*${options.slug}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        const keys = await redis.keys('catalog:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      // Redis error during cache invalidation is non-fatal
    }
  }
}
