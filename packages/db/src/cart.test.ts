import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  createCategory,
  createProductWithVariants,
  createStore,
  validateCartItems
} from './repositories';

describe('Cart Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `cart-test-store-${Date.now()}`;
  let storeId: string;
  let variantAId: string;
  let variantBId: string;

  beforeAll(async () => {
    // 1. Create a dedicated test store
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Cart Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    // 2. Create category
    const category = await createCategory(db, {
      storeId,
      slug: 'accessories',
      name: 'Accessories',
      sortOrder: 1,
      isActive: true
    });

    // 3. Create product with 2 variants
    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: 'signature-piece',
      title: 'Signature Nose Piece',
      description: 'Luxury handcrafted nose piece',
      status: 'published',
      variants: [
        {
          sku: `SKUA${Date.now()}`,
          title: 'Silver Accent',
          priceMinor: 59900,
          compareAtPriceMinor: 69900,
          currency: 'INR',
          weightGrams: 10,
          sortOrder: 0,
          isActive: true,
          initialQuantity: 5
        },
        {
          sku: `SKUB${Date.now()}`,
          title: 'Gold Accent',
          priceMinor: 79900,
          currency: 'INR',
          weightGrams: 10,
          sortOrder: 1,
          isActive: true,
          initialQuantity: 2
        }
      ],
      images: [
        {
          storageKey: 'products/sig.png',
          url: 'https://example.com/sig.png',
          altText: 'Signature Nose Piece',
          sortOrder: 0
        }
      ]
    });

    const vA = product.variants.find((v) => v.title === 'Silver Accent');
    const vB = product.variants.find((v) => v.title === 'Gold Accent');

    variantAId = vA!.id;
    variantBId = vB!.id;
  });

  it('validates empty cart correctly', async () => {
    const summary = await validateCartItems(db, storeId, []);
    expect(summary.items).toHaveLength(0);
    expect(summary.totalQuantity).toBe(0);
    expect(summary.subtotalMinor).toBe(0);
    expect(summary.isValidForCheckout).toBe(false);
  });

  it('reconciles valid active cart items with authoritative stock and pricing', async () => {
    const summary = await validateCartItems(db, storeId, [
      { variantId: variantAId, quantity: 2 },
      { variantId: variantBId, quantity: 1 }
    ]);

    expect(summary.items).toHaveLength(2);
    expect(summary.totalQuantity).toBe(3);
    // 2 * 59900 + 1 * 79900 = 119800 + 79900 = 199700 paise (₹1997.00)
    expect(summary.subtotalMinor).toBe(199700);
    expect(summary.currency).toBe('INR');
    expect(summary.isValidForCheckout).toBe(true);

    const itemA = summary.items[0]!;
    expect(itemA.productTitle).toBe('Signature Nose Piece');
    expect(itemA.variantTitle).toBe('Silver Accent');
    expect(itemA.effectiveQuantity).toBe(2);
    expect(itemA.availableQuantity).toBe(5);
    expect(itemA.lineTotalMinor).toBe(119800);
    expect(itemA.statusNotice).toBe('ok');
    expect(itemA.primaryImageUrl).toBe('https://example.com/sig.png');
  });

  it('detects when requested quantity exceeds available stock', async () => {
    // Variant B only has 2 in stock; request 4
    const summary = await validateCartItems(db, storeId, [{ variantId: variantBId, quantity: 4 }]);

    expect(summary.items).toHaveLength(1);
    const itemB = summary.items[0]!;
    expect(itemB.statusNotice).toBe('quantity_reduced');
    expect(itemB.availableQuantity).toBe(2);
    expect(itemB.effectiveQuantity).toBe(2);
    expect(itemB.lineTotalMinor).toBe(2 * 79900);
    expect(summary.isValidForCheckout).toBe(false); // Flags need for user confirmation
  });

  it('handles non-existent or unpublished variants safely', async () => {
    const fakeVariantId = '00000000-0000-0000-0000-000000000000';
    const summary = await validateCartItems(db, storeId, [
      { variantId: fakeVariantId, quantity: 1 }
    ]);

    expect(summary.items).toHaveLength(1);
    const item = summary.items[0]!;
    expect(item.isAvailable).toBe(false);
    expect(item.statusNotice).toBe('unavailable');
    expect(item.effectiveQuantity).toBe(0);
    expect(summary.isValidForCheckout).toBe(false);
  });
});
