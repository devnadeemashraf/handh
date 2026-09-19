import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  createCategory,
  createProductWithVariants,
  createStore,
  getExecutiveInsights
} from './repositories';
import { orderItems, orders } from './schema/orders';

describe('Executive Insights Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `insights-store-${Date.now()}`;
  let storeId: string;
  let variantId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Insights Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    const category = await createCategory(db, {
      storeId,
      slug: 'test-jewelry',
      name: 'Test Jewelry',
      sortOrder: 1,
      isActive: true
    });

    const { variants } = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `insights-item-${Date.now()}`,
      title: 'Royal Polki Nose Pin',
      description: 'Handcrafted bridal ornament',
      status: 'published',
      variants: [
        {
          sku: `SKU-INS-${Date.now()}`,
          title: 'Gold Finish',
          priceMinor: 99900,
          currency: 'INR',
          weightGrams: 5,
          sortOrder: 1,
          isActive: true,
          initialQuantity: 15
        }
      ],
      images: []
    });
    variantId = variants[0]!.id;

    const shippingAddress = {
      line1: 'Road No 10, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'India'
    };

    // Order 1: Paid, Captured, Unfulfilled (Amina Begum)
    const [order1] = await db
      .insert(orders)
      .values({
        orderNumber: `HH-INS-${Date.now()}-1`,
        storeId,
        status: 'paid',
        paymentStatus: 'captured',
        fulfillmentStatus: 'unfulfilled',
        customerEmail: 'amina.insights@test.com',
        customerPhone: '+919876543210',
        customerName: 'Amina Begum',
        shippingAddress,
        currency: 'INR',
        subtotalMinor: 120000,
        shippingMinor: 0,
        discountMinor: 0,
        totalMinor: 120000
      })
      .returning();

    await db.insert(orderItems).values({
      orderId: order1!.id,
      variantId,
      skuSnapshot: 'SKU-INS-POLKI',
      productNameSnapshot: 'Royal Polki Nose Pin',
      variantNameSnapshot: 'Gold Finish',
      unitPriceMinor: 60000,
      quantity: 2,
      totalPriceMinor: 120000
    });

    // Order 2: Completed, Captured, Shipped (Amina Begum - repeat order!)
    const [order2] = await db
      .insert(orders)
      .values({
        orderNumber: `HH-INS-${Date.now()}-2`,
        storeId,
        status: 'completed',
        paymentStatus: 'captured',
        fulfillmentStatus: 'shipped',
        customerEmail: 'amina.insights@test.com',
        customerPhone: '+919876543210',
        customerName: 'Amina Begum',
        shippingAddress,
        currency: 'INR',
        subtotalMinor: 80000,
        shippingMinor: 0,
        discountMinor: 0,
        totalMinor: 80000
      })
      .returning();

    await db.insert(orderItems).values({
      orderId: order2!.id,
      variantId,
      skuSnapshot: 'SKU-INS-POLKI',
      productNameSnapshot: 'Royal Polki Nose Pin',
      variantNameSnapshot: 'Gold Finish',
      unitPriceMinor: 80000,
      quantity: 1,
      totalPriceMinor: 80000
    });

    // Order 3: Pending payment, unpaid (Farah Sheikh - should NOT be included in revenue)
    await db.insert(orders).values({
      orderNumber: `HH-INS-${Date.now()}-3`,
      storeId,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      fulfillmentStatus: 'unfulfilled',
      customerEmail: 'farah.unpaid@test.com',
      customerPhone: '+919123456789',
      customerName: 'Farah Sheikh',
      shippingAddress,
      currency: 'INR',
      subtotalMinor: 50000,
      shippingMinor: 0,
      discountMinor: 0,
      totalMinor: 50000
    });
  });

  it('aggregates sales scoreboard, customer frequency and product velocity accurately', async () => {
    const insights = await getExecutiveInsights(db, testStoreSlug, 'all');

    // Sales scoreboard
    expect(insights.sales.revenueMinor).toBe(200000); // 120000 + 80000
    expect(insights.sales.orderCount).toBe(2);
    expect(insights.sales.aovMinor).toBe(100000); // 200000 / 2
    expect(insights.sales.pendingFulfillmentCount).toBe(1); // order 1 is unfulfilled

    // Customer frequency & loyalty
    expect(insights.customers.totalCustomers).toBe(1);
    expect(insights.customers.repeatCustomers).toBe(1);
    expect(insights.customers.repeatRatePercentage).toBe(100);

    const topCustomer = insights.customers.topCustomers[0];
    expect(topCustomer).toBeDefined();
    expect(topCustomer?.customerEmail).toBe('amina.insights@test.com');
    expect(topCustomer?.orderCount).toBe(2);
    expect(topCustomer?.totalSpendMinor).toBe(200000);
    expect(topCustomer?.isRepeatCustomer).toBe(true);

    // Product velocity leaderboard
    expect(insights.productVelocity.length).toBeGreaterThan(0);
    const topProduct = insights.productVelocity[0];
    expect(topProduct?.productTitle).toBe('Royal Polki Nose Pin');
    expect(topProduct?.unitsSold).toBe(3); // 2 + 1
    expect(topProduct?.revenueMinor).toBe(200000);
    expect(topProduct?.currentStock).toBe(15);
  });

  it('filters data within today timeframe', async () => {
    const todayInsights = await getExecutiveInsights(db, testStoreSlug, 'today');
    // Orders were created today in beforeAll
    expect(todayInsights.sales.orderCount).toBe(2);
    expect(todayInsights.sales.revenueMinor).toBe(200000);
  });
});
