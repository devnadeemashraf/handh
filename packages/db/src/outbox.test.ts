import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  confirmPaymentAndCaptureOrder,
  createCategory,
  createPaymentAttempt,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore,
  fetchPendingOutboxEvents,
  findOutboxEventById,
  insertOutboxEvent,
  markOutboxEventFailed,
  markOutboxEventPublished
} from './repositories';

describe('Outbox Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `outbox-test-store-${Date.now()}`;
  let storeId: string;
  let variantId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Outbox Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    const category = await createCategory(db, {
      storeId,
      name: 'Abayas',
      slug: `abayas-${Date.now()}`,
      sortOrder: 1,
      isActive: true
    });

    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      title: 'Outbox Silk Abaya',
      description: 'Handcrafted luxury abaya',
      slug: `outbox-silk-abaya-${Date.now()}`,
      status: 'published',
      variants: [
        {
          sku: `OUTBOX-SKU-${Date.now()}`,
          title: 'Standard',
          priceMinor: 499900,
          currency: 'INR',
          weightGrams: 500,
          sortOrder: 0,
          isActive: true,
          initialQuantity: 10
        }
      ],
      images: []
    });

    variantId = product.variants[0]!.id;
  });

  it('inserts and fetches pending outbox events', async () => {
    const event = await insertOutboxEvent(db, {
      eventName: 'order.paid',
      aggregateType: 'order',
      aggregateId: 'test-order-1',
      payload: { test: true, orderId: 'test-order-1' },
      status: 'pending',
      scheduledAt: new Date(Date.now() - 1000) // already due
    });

    expect(event.id).toBeDefined();
    expect(event.status).toBe('pending');

    const pending = await fetchPendingOutboxEvents(db, 100);
    const found = pending.find((e) => e.id === event.id);
    expect(found).toBeDefined();
    expect(found?.eventName).toBe('order.paid');
  });

  it('marks an outbox event as published', async () => {
    const event = await insertOutboxEvent(db, {
      eventName: 'order.dispatched',
      aggregateType: 'order',
      aggregateId: 'test-order-2',
      payload: { trackingNumber: 'TEST-123' },
      status: 'pending'
    });

    const published = await markOutboxEventPublished(db, event.id);
    expect(published?.status).toBe('published');
    expect(published?.processedAt).toBeDefined();

    const fetched = await findOutboxEventById(db, event.id);
    expect(fetched?.status).toBe('published');
  });

  it('handles retry backoff and failure exhaustion', async () => {
    const event = await insertOutboxEvent(db, {
      eventName: 'order.delivered',
      aggregateType: 'order',
      aggregateId: 'test-order-3',
      payload: { awb: 'AWB-TEST' },
      status: 'pending'
    });

    // 1. First failure - should back off and stay pending
    const retried1 = await markOutboxEventFailed(db, event.id, 'Connection timeout', {
      maxRetries: 3,
      baseBackoffSeconds: 2
    });
    expect(retried1?.status).toBe('pending');
    expect(retried1?.retryCount).toBe(1);
    expect(retried1?.errorMessage).toContain('Connection timeout');

    // 2. Second failure
    const retried2 = await markOutboxEventFailed(db, event.id, 'Connection timeout 2', {
      maxRetries: 3,
      baseBackoffSeconds: 2
    });
    expect(retried2?.status).toBe('pending');
    expect(retried2?.retryCount).toBe(2);

    // 3. Third failure - max retries reached, marks failed
    const failed = await markOutboxEventFailed(db, event.id, 'Final timeout error', {
      maxRetries: 3,
      baseBackoffSeconds: 2
    });
    expect(failed?.status).toBe('failed');
    expect(failed?.retryCount).toBe(3);
    expect(failed?.errorMessage).toBe('Final timeout error');
  });

  it('emits order.paid outbox event upon confirmPaymentAndCaptureOrder', async () => {
    // Create pending checkout order
    const pendingOrder = await createPendingCheckoutOrder(db, {
      storeId,
      idempotencyKey: `idemp-outbox-${Date.now()}`,
      shippingAddress: {
        fullName: 'Outbox Customer',
        phone: '+919876543210',
        email: 'outbox-customer@example.com',
        line1: '123 Luxury Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN'
      },
      items: [
        {
          variantId,
          quantity: 1
        }
      ]
    });

    // Create payment attempt
    const providerOrderId = `rzp_order_outbox_${Date.now()}`;
    await createPaymentAttempt(db, {
      orderId: pendingOrder.orderId,
      providerOrderId,
      amountMinor: pendingOrder.totalMinor
    });

    // Confirm payment
    const result = await confirmPaymentAndCaptureOrder(db, {
      orderId: pendingOrder.orderId,
      providerOrderId,
      providerPaymentId: `pay_outbox_${Date.now()}`,
      providerSignature: 'valid_mock_signature'
    });

    expect(result.order.status).toBe('paid');

    // Verify order.paid outbox event was recorded
    const pending = await fetchPendingOutboxEvents(db, 100);
    const paidEvent = pending.find(
      (e) => e.eventName === 'order.paid' && e.aggregateId === pendingOrder.orderId
    );

    expect(paidEvent).toBeDefined();
    expect(paidEvent?.aggregateType).toBe('order');
    const payload = paidEvent?.payload as Record<string, unknown>;
    expect(payload['customerEmail']).toBe('outbox-customer@example.com');
    expect(payload['totalMinor']).toBe(499900);
  });
});
