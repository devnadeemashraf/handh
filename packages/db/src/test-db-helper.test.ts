import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  createCategory,
  createCoupon,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore
} from './repositories';
import { coupons, inventoryLevels, orders, products, stores } from './schema';
import { cleanupTestStore, closeDbClient, closeSharedDbClients } from './test-db-helper';

describe('Test Database Isolation & Teardown Helper (E-COM-173)', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  it('completely cascades and deletes all store entities and orders with cleanupTestStore', async () => {
    const timestamp = Date.now();
    const testStoreSlug = `cleanup-test-store-${timestamp}`;

    // 1. Create a store with complete hierarchy
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Cleanup Verification Boutique',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });

    const category = await createCategory(db, {
      storeId: store.id,
      slug: `cleanup-cat-${timestamp}`,
      name: 'Cleanup Category',
      sortOrder: 1,
      isActive: true
    });

    const product = await createProductWithVariants(db, {
      storeId: store.id,
      categoryId: category.id,
      slug: `cleanup-prod-${timestamp}`,
      title: 'Cleanup Product',
      description: 'Will be purged',
      status: 'published',
      variants: [
        {
          sku: `SKU-CLN-${timestamp}`,
          title: 'Cleanup Variant',
          priceMinor: 50000,
          currency: 'INR',
          sortOrder: 0,
          isActive: true,
          initialQuantity: 10
        }
      ]
    });

    await createCoupon(db, testStoreSlug, {
      code: `CLN-${timestamp}`,
      discountType: 'fixed',
      value: 5000,
      minOrderValueMinor: 10000,
      isActive: true
    });

    const orderResult = await createPendingCheckoutOrder(db, {
      storeId: store.id,
      idempotencyKey: `cln-order-${timestamp}`,
      items: [{ variantId: product.variants[0]!.id, quantity: 1 }],
      shippingAddress: {
        fullName: 'Cleanup Tester',
        phone: '+919876543210',
        email: 'cln@example.com',
        line1: 'Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'IN'
      }
    });

    // Verify everything exists prior to cleanup
    const [persistedStore] = await db.select().from(stores).where(eq(stores.id, store.id));
    expect(persistedStore).toBeDefined();

    const [persistedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderResult.orderId));
    expect(persistedOrder).toBeDefined();

    // 2. Perform teardown
    await cleanupTestStore(db, store.id);

    // 3. Assert zero residual state
    const storesAfter = await db.select().from(stores).where(eq(stores.id, store.id));
    expect(storesAfter.length).toBe(0);

    const productsAfter = await db.select().from(products).where(eq(products.storeId, store.id));
    expect(productsAfter.length).toBe(0);

    const ordersAfter = await db.select().from(orders).where(eq(orders.storeId, store.id));
    expect(ordersAfter.length).toBe(0);

    const couponsAfter = await db.select().from(coupons).where(eq(coupons.storeId, store.id));
    expect(couponsAfter.length).toBe(0);

    const invAfter = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, product.variants[0]!.id));
    expect(invAfter.length).toBe(0);
  });

  it('safely closes individual database client and shared pools without throwing', async () => {
    await expect(closeDbClient(db)).resolves.not.toThrow();
    await expect(closeSharedDbClients()).resolves.not.toThrow();
  });
});
