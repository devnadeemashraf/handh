import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError, ValidationError } from '@hh/domain';

import { createDbClient } from './index';
import {
  createCategory,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore,
  findOrderById,
  findOrderByOrderNumber
} from './repositories';
import { inventoryLevels } from './schema';

describe('Order Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `order-test-store-${Date.now()}`;
  let storeId: string;
  let variantAId: string;
  let variantBId: string;

  beforeAll(async () => {
    // 1. Create a dedicated test store
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Order Test Store',
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

    // 3. Create product with initial inventory:
    // Variant A: 5 on_hand, 0 reserved (5 available)
    // Variant B: 2 on_hand, 0 reserved (2 available)
    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `np-order-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Artisanal Emerald Nose Piece',
      description: 'Handcrafted signature piece',
      status: 'published',
      variants: [
        {
          sku: `SKUA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'Silver Accent',
          priceMinor: 59900, // ₹599.00
          currency: 'INR',
          weightGrams: 10,
          sortOrder: 0,
          isActive: true,
          initialQuantity: 5
        },
        {
          sku: `SKUB-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'Gold Accent',
          priceMinor: 79900, // ₹799.00
          currency: 'INR',
          weightGrams: 10,
          sortOrder: 1,
          isActive: true,
          initialQuantity: 2
        }
      ],
      images: [
        {
          storageKey: 'products/np-order.jpg',
          url: 'https://example.com/np-order.jpg',
          altText: 'Emerald Nose Piece',
          sortOrder: 0
        }
      ]
    });

    const vA = product.variants.find((v) => v.title === 'Silver Accent')!;
    const vB = product.variants.find((v) => v.title === 'Gold Accent')!;

    variantAId = vA.id;
    variantBId = vB.id;
  });

  it('atomically creates order, line items, and reserves inventory', async () => {
    const idempotencyKey = '11111111-2222-3333-4444-555555555555';

    const orderResult = await createPendingCheckoutOrder(db, {
      storeId,
      items: [
        { variantId: variantAId, quantity: 2 }, // 2 * 59900 = 119800
        { variantId: variantBId, quantity: 1 } // 1 * 79900 = 79900
      ],
      shippingAddress: {
        fullName: 'Maryam Siddiqui',
        phone: '9876543210',
        email: 'maryam@example.com',
        line1: 'Flat 101, Palm Heights',
        line2: 'Near Metro Station',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500028',
        country: 'IN'
      },
      customerNotes: 'Please ring the bell twice',
      idempotencyKey
    });

    expect(orderResult.orderId).toBeDefined();
    expect(orderResult.orderNumber).toMatch(/^HH-\d{4}-[A-Z0-9]{5}$/);
    // Subtotal: 119800 + 79900 = 199700 paise (₹1997.00 >= ₹999 -> Free delivery)
    expect(orderResult.subtotalMinor).toBe(199700);
    expect(orderResult.shippingMinor).toBe(0);
    expect(orderResult.totalMinor).toBe(199700);

    // Verify inventory level reservation update
    const [invA] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantAId));
    expect(invA?.reserved).toBe(2);

    const [invB] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantBId));
    expect(invB?.reserved).toBe(1);

    // Verify order lookup with items
    const orderRecord = await findOrderById(db, orderResult.orderId);
    expect(orderRecord).not.toBeNull();
    expect(orderRecord?.customerName).toBe('Maryam Siddiqui');
    expect(orderRecord?.status).toBe('pending_payment');
    expect(orderRecord?.paymentStatus).toBe('unpaid');
    expect(orderRecord?.items).toHaveLength(2);

    const itemA = orderRecord?.items.find((i) => i.variantId === variantAId);
    expect(itemA?.productNameSnapshot).toBe('Artisanal Emerald Nose Piece');
    expect(itemA?.variantNameSnapshot).toBe('Silver Accent');
    expect(itemA?.unitPriceMinor).toBe(59900);
    expect(itemA?.quantity).toBe(2);
    expect(itemA?.totalPriceMinor).toBe(119800);
  });

  it('guarantees idempotency on duplicate checkout submissions', async () => {
    const idempotencyKey = '99999999-8888-7777-6666-555555555555';

    // First submission
    const firstAttempt = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId: variantAId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Sameera Ali',
        phone: '9876543211',
        email: 'sameera@example.com',
        line1: 'House 5, Green View',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN'
      },
      idempotencyKey
    });

    // Check reserved units after first attempt (2 from previous test + 1 = 3)
    const [invBefore] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantAId));
    expect(invBefore?.reserved).toBe(3);

    // Second submission with identical idempotencyKey
    const secondAttempt = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId: variantAId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Sameera Ali',
        phone: '9876543211',
        email: 'sameera@example.com',
        line1: 'House 5, Green View',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'IN'
      },
      idempotencyKey
    });

    // Must return the exact same order without double-decrementing stock
    expect(secondAttempt.orderId).toBe(firstAttempt.orderId);
    expect(secondAttempt.orderNumber).toBe(firstAttempt.orderNumber);

    const [invAfter] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantAId));
    expect(invAfter?.reserved).toBe(3); // Still 3, NOT 4!
  });

  it('rejects order and prevents overselling when requested stock exceeds available units', async () => {
    // Variant B only had 2 units initial, 1 reserved in test 1 => 1 available.
    // Requesting 2 units must throw ConflictError
    await expect(
      createPendingCheckoutOrder(db, {
        storeId,
        items: [{ variantId: variantBId, quantity: 2 }],
        shippingAddress: {
          fullName: 'Amina Begum',
          phone: '9876543212',
          email: 'amina@example.com',
          line1: 'Flat 3B, Crescent Towers',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
          country: 'IN'
        },
        idempotencyKey: '77777777-6666-5555-4444-333333333333'
      })
    ).rejects.toThrow(ConflictError);

    // Reserved units must remain unchanged
    const [invB] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantBId));
    expect(invB?.reserved).toBe(1);
  });

  it('finds order by public order number', async () => {
    const idempotencyKey = '44444444-3333-2222-1111-000000000000';
    const created = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId: variantAId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Hafsa Noor',
        phone: '9876543213',
        email: 'hafsa@example.com',
        line1: 'Building 4, Sector 7',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'IN'
      },
      idempotencyKey
    });

    const found = await findOrderByOrderNumber(db, created.orderNumber);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.orderId);
    expect(found?.customerName).toBe('Hafsa Noor');
  });

  it('rejects order with ValidationError when items list is empty', async () => {
    await expect(
      createPendingCheckoutOrder(db, {
        storeId,
        items: [],
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543214',
          email: 'test@example.com',
          line1: 'Line 1',
          city: 'City',
          state: 'State',
          postalCode: '123456',
          country: 'IN'
        },
        idempotencyKey: '55555555-5555-5555-5555-555555555555'
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects order with NotFoundError when requested variant does not exist', async () => {
    const nonExistentVariantId = '00000000-0000-0000-0000-000000000000';
    await expect(
      createPendingCheckoutOrder(db, {
        storeId,
        items: [{ variantId: nonExistentVariantId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543214',
          email: 'test@example.com',
          line1: 'Line 1',
          city: 'City',
          state: 'State',
          postalCode: '123456',
          country: 'IN'
        },
        idempotencyKey: '66666666-6666-6666-6666-666666666666'
      })
    ).rejects.toThrow(NotFoundError);
  });
});
