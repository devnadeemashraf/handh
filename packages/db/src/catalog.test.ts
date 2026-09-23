import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  createCategory,
  createProductWithVariants,
  createStore,
  findProductBySlug,
  findStoreBySlug,
  getCategoryTree,
  listPublishedProducts
} from './repositories';

describe('Catalog Domain Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `test-store-${Date.now()}`;
  let storeId: string;
  let accessoriesCatId: string;
  let jewelryCatId: string;

  beforeAll(async () => {
    // 1. Create a dedicated isolated store for testing
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Integration Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    // 2. Create hierarchical categories
    const accessories = await createCategory(db, {
      storeId,
      slug: 'accessories',
      name: 'Accessories',
      sortOrder: 1,
      isActive: true
    });
    accessoriesCatId = accessories.id;

    const jewelry = await createCategory(db, {
      storeId,
      parentId: accessoriesCatId,
      slug: 'jewelry',
      name: 'Jewelry',
      sortOrder: 1,
      isActive: true
    });
    jewelryCatId = jewelry.id;
  });

  it('resolves stores by slug correctly', async () => {
    const found = await findStoreBySlug(db, testStoreSlug);
    expect(found).not.toBeNull();
    expect(found?.slug).toBe(testStoreSlug);
    expect(found?.name).toBe('Integration Test Store');
  });

  it('builds a hierarchical category tree', async () => {
    const tree = await getCategoryTree(db, storeId);
    expect(tree.length).toBe(1);
    expect(tree[0]?.slug).toBe('accessories');
    expect(tree[0]?.subcategories.length).toBe(1);
    expect(tree[0]?.subcategories[0]?.slug).toBe('jewelry');
  });

  it('atomically creates product, variants, and inventory levels', async () => {
    const productSlug = `test-np-${Date.now()}`;
    const sku = `TEST-SKU-${Date.now()}`;

    const { product, variants } = await createProductWithVariants(db, {
      storeId,
      categoryId: jewelryCatId,
      slug: productSlug,
      title: 'Test Gold Nose Piece',
      description: 'Test description for nose piece.',
      status: 'published',
      variants: [
        {
          sku,
          title: 'Standard',
          priceMinor: 59900,
          currency: 'INR',
          weightGrams: 10,
          sortOrder: 0,
          isActive: true,
          initialQuantity: 5
        }
      ],
      images: [
        {
          storageKey: 'products/test-01.jpg',
          url: 'https://images.handh.local/test-01.jpg',
          altText: 'Test Gold Nose Piece',
          sortOrder: 0
        }
      ]
    });

    expect(product.id).toBeDefined();
    expect(product.slug).toBe(productSlug);
    expect(variants.length).toBe(1);
    expect(variants[0]?.sku).toBe(sku);
    expect(Number(variants[0]?.priceMinor)).toBe(59900);

    // Verify querying published catalog
    const catalogList = await listPublishedProducts(db, storeId);
    expect(catalogList.length).toBeGreaterThanOrEqual(1);

    const match = catalogList.find((p) => p.slug === productSlug);
    expect(match).toBeDefined();
    expect(match?.startingPriceMinor).toBe(59900);
    expect(match?.isAvailable).toBe(true);

    // Verify querying product detail with variants and stock calculation
    const detail = await findProductBySlug(db, storeId, productSlug);
    expect(detail).not.toBeNull();
    expect(detail?.title).toBe('Test Gold Nose Piece');
    expect(detail?.category?.name).toBe('Jewelry');
    expect(detail?.variants.length).toBe(1);
    expect(detail?.variants[0]?.sku).toBe(sku);
    expect(detail?.variants[0]?.availableQuantity).toBe(5);
    expect(detail?.variants[0]?.isAvailable).toBe(true);

    // Verify statutory Legal Metrology declarations
    expect(detail?.countryOfOrigin).toBe('India');
    expect(detail?.netQuantity).toBe('1 N');
    expect(detail?.commodityName).toBe('Test Gold Nose Piece');
    expect(detail?.manufacturerDetails.name).toBe('H&H Luxury Modest Wear Private Limited');
    expect(detail?.consumerCareDetails?.email).toBe('support@handh.in');
  });
});
