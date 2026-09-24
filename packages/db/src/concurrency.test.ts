import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError } from '@hh/domain';

import { createDbClient } from './index';
import {
  createCategory,
  createCoupon,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore
} from './repositories';
import { coupons, inventoryLevels, inventoryReservations, orders } from './schema';
import { cleanupTestStore, closeDbClient } from './test-db-helper';

describe('Database Concurrency & Race Condition Guard (E-COM-172, E-COM-173)', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `concurrency-store-${Date.now()}`;
  let storeId: string;
  let scarceVariantId: string;
  let multiVariantId: string;
  let couponVariantId: string;
  let idempotencyVariantId: string;
  let rollbackVariantId: string;
  let singleUseCouponCode: string;

  beforeAll(async () => {
    // 1. Create isolated test store
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Concurrency Test Boutique',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    // 2. Create category
    const category = await createCategory(db, {
      storeId,
      slug: 'concurrency-gems',
      name: 'High Concurrency Gems',
      sortOrder: 1,
      isActive: true
    });

    // 3. Create products with inventory for various race condition scenarios
    // - Scarce Variant: on_hand = 1 (10 concurrent buyers)
    // - Multi Variant: on_hand = 5 (5 buyers wanting 2 each = 10 requested)
    // - Coupon Variant: on_hand = 50 (plenty stock, 6 concurrent single-use coupon claims)
    // - Idempotency Variant: on_hand = 10
    // - Rollback Variant: on_hand = 10
    const timestamp = Date.now();
    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `race-condition-pieces-${timestamp}`,
      title: 'Limited Edition Emerald Collection',
      description: 'Handcrafted jewellery for race condition testing',
      status: 'published',
      variants: [
        {
          sku: `SKU-SCARCE-${timestamp}`,
          title: 'Single Solitaire Ring',
          priceMinor: 150000, // ₹1,500.00
          currency: 'INR',
          sortOrder: 0,
          isActive: true,
          initialQuantity: 1
        },
        {
          sku: `SKU-MULTI-${timestamp}`,
          title: 'Gold Trim Nose Piece',
          priceMinor: 85000, // ₹850.00
          currency: 'INR',
          sortOrder: 1,
          isActive: true,
          initialQuantity: 5
        },
        {
          sku: `SKU-COUPON-${timestamp}`,
          title: 'Silver Anklet Pair',
          priceMinor: 120000, // ₹1,200.00
          currency: 'INR',
          sortOrder: 2,
          isActive: true,
          initialQuantity: 50
        },
        {
          sku: `SKU-IDEM-${timestamp}`,
          title: 'Royal Pearl Brooch',
          priceMinor: 99000, // ₹990.00
          currency: 'INR',
          sortOrder: 3,
          isActive: true,
          initialQuantity: 10
        },
        {
          sku: `SKU-ROLLBACK-${timestamp}`,
          title: 'Vintage Ruby Choker',
          priceMinor: 250000, // ₹2,500.00
          currency: 'INR',
          sortOrder: 4,
          isActive: true,
          initialQuantity: 10
        }
      ]
    });

    scarceVariantId = product.variants[0]!.id;
    multiVariantId = product.variants[1]!.id;
    couponVariantId = product.variants[2]!.id;
    idempotencyVariantId = product.variants[3]!.id;
    rollbackVariantId = product.variants[4]!.id;

    // 4. Create a single-use coupon
    singleUseCouponCode = `FLASH1-${timestamp}`;
    await createCoupon(db, testStoreSlug, {
      code: singleUseCouponCode,
      discountType: 'percentage',
      value: 20,
      usageLimit: 1,
      minOrderValueMinor: 50000,
      isActive: true
    });
  });

  afterAll(async () => {
    // Teardown: Purge all entities created for this test store and close DB pool
    await cleanupTestStore(db, storeId);
    await closeDbClient(db);
  });

  it('prevents overselling under high concurrency: exactly 1 of 10 simultaneous orders claims scarce stock', async () => {
    const concurrentCallers = 10;
    const checkoutRequests = Array.from({ length: concurrentCallers }, (_, idx) =>
      createPendingCheckoutOrder(db, {
        storeId,
        idempotencyKey: `scarce-req-${idx}-${randomUUID()}`,
        items: [{ variantId: scarceVariantId, quantity: 1 }],
        shippingAddress: {
          fullName: `Concurrent Buyer ${idx}`,
          phone: '+919876543210',
          email: `buyer${idx}@example.com`,
          line1: `${idx} Banjara Hills`,
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500034',
          country: 'IN'
        }
      })
    );

    const results = await Promise.allSettled(checkoutRequests);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof createPendingCheckoutOrder>>> =>
        r.status === 'fulfilled'
    );
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

    // High concurrency assertion: Exactly 1 caller succeeds, 9 are rejected due to locked stock
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(concurrentCallers - 1);

    // Validate that rejections are ConflictErrors citing insufficient stock
    for (const rej of rejected) {
      expect(rej.reason).toBeInstanceOf(ConflictError);
      expect((rej.reason as ConflictError).message).toMatch(/Insufficient stock/i);
    }

    // Verify inventory state in database: onHand remains 1, reserved is 1, available is 0
    const [inv] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, scarceVariantId));
    expect(inv).toBeDefined();
    expect(inv!.onHand).toBe(1);
    expect(inv!.reserved).toBe(1);

    // Verify exactly 1 reservation row exists
    const reservations = await db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.variantId, scarceVariantId));
    expect(reservations.length).toBe(1);
    expect(reservations[0]!.quantity).toBe(1);
  });

  it('handles multi-item contention accurately: exactly 2 of 5 concurrent requests succeed when stock is 5 and requested is 2 each', async () => {
    // 5 units available. 5 requests wanting 2 units each = 10 requested.
    // Only 2 requests can succeed (2 * 2 = 4 units reserved, leaving 1 unit, which is < 2).
    const concurrentCallers = 5;
    const checkoutRequests = Array.from({ length: concurrentCallers }, (_, idx) =>
      createPendingCheckoutOrder(db, {
        storeId,
        idempotencyKey: `multi-req-${idx}-${randomUUID()}`,
        items: [{ variantId: multiVariantId, quantity: 2 }],
        shippingAddress: {
          fullName: `Multi Buyer ${idx}`,
          phone: '+919876543210',
          email: `multibuyer${idx}@example.com`,
          line1: `${idx} Jubilee Hills`,
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'IN'
        }
      })
    );

    const results = await Promise.allSettled(checkoutRequests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(3);

    for (const rej of rejected) {
      expect(rej.reason).toBeInstanceOf(ConflictError);
      expect((rej.reason as ConflictError).message).toMatch(/Insufficient stock/i);
    }

    // Verify database state: onHand = 5, reserved = 4
    const [inv] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, multiVariantId));
    expect(inv!.onHand).toBe(5);
    expect(inv!.reserved).toBe(4);
  });

  it('enforces single-use coupon redemption limit under concurrent checkout submissions', async () => {
    // 6 concurrent requests competing for a coupon with usageLimit = 1
    const concurrentCallers = 6;
    const checkoutRequests = Array.from({ length: concurrentCallers }, (_, idx) =>
      createPendingCheckoutOrder(db, {
        storeId,
        couponCode: singleUseCouponCode,
        idempotencyKey: `coupon-req-${idx}-${randomUUID()}`,
        items: [{ variantId: couponVariantId, quantity: 1 }],
        shippingAddress: {
          fullName: `Coupon Buyer ${idx}`,
          phone: '+919876543210',
          email: `couponbuyer${idx}@example.com`,
          line1: `${idx} Hitec City`,
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500081',
          country: 'IN'
        }
      })
    );

    const results = await Promise.allSettled(checkoutRequests);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly 1 order successfully claimed the coupon
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(concurrentCallers - 1);

    // Other requests were rejected with ConflictError ("maximum redemption limit")
    for (const rej of rejected) {
      expect(rej.reason).toBeInstanceOf(ConflictError);
      expect((rej.reason as ConflictError).message).toMatch(
        /maximum redemption limit|no longer valid/i
      );
    }

    // Verify database: times_used is exactly 1 and never exceeded usage_limit
    const [couponRecord] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.storeId, storeId), eq(coupons.code, singleUseCouponCode)));
    expect(couponRecord).toBeDefined();
    expect(couponRecord!.timesUsed).toBe(1);
    expect(couponRecord!.usageLimit).toBe(1);
  });

  it('deduplicates parallel identical requests with identical idempotency keys', async () => {
    const sharedIdempotencyKey = `idem-race-${randomUUID()}`;
    const concurrentCallers = 5;

    // Fire 5 simultaneous checkout requests with the same idempotency key
    const checkoutRequests = Array.from({ length: concurrentCallers }, () =>
      createPendingCheckoutOrder(db, {
        storeId,
        idempotencyKey: sharedIdempotencyKey,
        items: [{ variantId: idempotencyVariantId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Idempotent Buyer',
          phone: '+919876543210',
          email: 'idem@example.com',
          line1: '100 Marine Drive',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400020',
          country: 'IN'
        }
      })
    );

    const results = await Promise.allSettled(checkoutRequests);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof createPendingCheckoutOrder>>> =>
        r.status === 'fulfilled'
    );

    // At least one succeeds; all fulfilled results must point to the identical order number & order ID
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const primaryOrderId = fulfilled[0]!.value.orderId;
    const primaryOrderNumber = fulfilled[0]!.value.orderNumber;

    for (const res of fulfilled) {
      expect(res.value.orderId).toBe(primaryOrderId);
      expect(res.value.orderNumber).toBe(primaryOrderNumber);
    }

    // In the database: Exactly 1 order record exists for this idempotency key
    const matchingOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.idempotencyKey, sharedIdempotencyKey)));
    expect(matchingOrders.length).toBe(1);

    // Inventory reserved was incremented only once
    const [inv] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, idempotencyVariantId));
    expect(inv!.reserved).toBe(1);
  });

  it('atomically rolls back inventory reservations if a subsequent checkout step fails', async () => {
    const nonExistentVariantId = randomUUID();

    // Check initial inventory
    const [initialInv] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, rollbackVariantId));
    expect(initialInv!.reserved).toBe(0);

    // Attempt checkout containing a valid variant and an invalid variant
    await expect(
      createPendingCheckoutOrder(db, {
        storeId,
        idempotencyKey: `rollback-test-${randomUUID()}`,
        items: [
          { variantId: rollbackVariantId, quantity: 2 },
          { variantId: nonExistentVariantId, quantity: 1 }
        ],
        shippingAddress: {
          fullName: 'Rollback Buyer',
          phone: '+919876543210',
          email: 'rollback@example.com',
          line1: 'Secret Street',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'IN'
        }
      })
    ).rejects.toThrow(NotFoundError);

    // Verify rollback: reserved inventory remains 0, no leaked reservations
    const [afterInv] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, rollbackVariantId));
    expect(afterInv!.reserved).toBe(0);

    const reservations = await db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.variantId, rollbackVariantId));
    expect(reservations.length).toBe(0);
  });
});
