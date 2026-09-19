import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  confirmPaymentAndCaptureOrder,
  createCategory,
  createPaymentAttempt,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore,
  findPaymentAttemptByProviderOrderId,
  recordAndProcessWebhookEvent,
  recordPaymentFailure
} from './repositories';
import { inventoryLevels, inventoryReservations, orders } from './schema';

describe('Payment Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `payment-test-store-${Date.now()}`;
  let storeId: string;
  let variantId: string;

  beforeAll(async () => {
    // 1. Create test store
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Payment Test Store',
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

    // 3. Create product with initial inventory (10 onHand, 0 reserved)
    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `payment-test-np-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Royal Sapphire Nose Ring',
      description: 'Handcrafted signature piece',
      status: 'published',
      variants: [
        {
          sku: `SKU-PAY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'Royal Blue Sapphire',
          priceMinor: 129900, // ₹1,299.00
          currency: 'INR',
          weightGrams: 12,
          sortOrder: 0,
          isActive: true,
          initialQuantity: 10
        }
      ],
      images: []
    });

    variantId = product.variants[0]!.id;
  });

  it('creates payment attempt and atomically captures order, consumes reservations and decrements stock', async () => {
    // 1. Create a pending order (quantity 2)
    const orderResult = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId, quantity: 2 }],
      shippingAddress: {
        fullName: 'Fatima Zahra',
        phone: '9876543210',
        email: 'fatima@example.com',
        line1: '12 Emerald St',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500001',
        country: 'IN'
      },
      idempotencyKey: 'aaaa1111-bbbb-cccc-dddd-eeee11112222'
    });

    // Verify initial reservation: 10 onHand, 2 reserved
    const [invInitial] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId));
    expect(invInitial?.onHand).toBe(10);
    expect(invInitial?.reserved).toBe(2);

    // 2. Create payment attempt
    const providerOrderId = `order_test_${Date.now()}`;
    const attempt = await createPaymentAttempt(db, {
      orderId: orderResult.orderId,
      providerOrderId,
      amountMinor: orderResult.totalMinor,
      currency: 'INR'
    });

    expect(attempt.status).toBe('initiated');
    expect(attempt.providerOrderId).toBe(providerOrderId);

    const foundAttempt = await findPaymentAttemptByProviderOrderId(db, providerOrderId);
    expect(foundAttempt).not.toBeNull();
    expect(foundAttempt?.id).toBe(attempt.id);

    // 3. Confirm payment and capture order
    const providerPaymentId = `pay_test_${Date.now()}`;
    const providerSignature = 'mock_valid_signature_hash_1234567890abcdef';

    const captureResult = await confirmPaymentAndCaptureOrder(db, {
      orderId: orderResult.orderId,
      providerOrderId,
      providerPaymentId,
      providerSignature
    });

    // Verify order state
    expect(captureResult.order.status).toBe('paid');
    expect(captureResult.order.paymentStatus).toBe('captured');

    // Verify payment attempt state
    expect(captureResult.paymentAttempt.status).toBe('captured');
    expect(captureResult.paymentAttempt.providerPaymentId).toBe(providerPaymentId);
    expect(captureResult.paymentAttempt.providerSignature).toBe(providerSignature);

    // Verify reservations are consumed
    const [reservation] = await db
      .select()
      .from(inventoryReservations)
      .where(eq(inventoryReservations.orderId, orderResult.orderId));
    expect(reservation?.status).toBe('consumed');

    // Verify inventory levels: onHand decremented from 10 -> 8, reserved decremented from 2 -> 0!
    const [invAfterCapture] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId));
    expect(invAfterCapture?.onHand).toBe(8);
    expect(invAfterCapture?.reserved).toBe(0);

    // 4. Idempotency test: calling confirm again must succeed without re-decrementing inventory
    const retryCapture = await confirmPaymentAndCaptureOrder(db, {
      orderId: orderResult.orderId,
      providerOrderId,
      providerPaymentId,
      providerSignature
    });

    expect(retryCapture.order.status).toBe('paid');
    const [invAfterRetry] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId));
    expect(invAfterRetry?.onHand).toBe(8); // Still 8!
    expect(invAfterRetry?.reserved).toBe(0);
  });

  it('records payment failure on attempt while keeping order pending for retry', async () => {
    const orderResult = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Ayesha Khan',
        phone: '9876543211',
        email: 'ayesha@example.com',
        line1: '45 Rose Ave',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'IN'
      },
      idempotencyKey: 'ffff2222-bbbb-cccc-dddd-eeee33334444'
    });

    const failedProviderOrderId = `order_fail_${Date.now()}`;
    await createPaymentAttempt(db, {
      orderId: orderResult.orderId,
      providerOrderId: failedProviderOrderId,
      amountMinor: orderResult.totalMinor
    });

    const failedAttempt = await recordPaymentFailure(db, {
      providerOrderId: failedProviderOrderId,
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Card payment was declined by issuing bank'
    });

    expect(failedAttempt).not.toBeNull();
    expect(failedAttempt?.status).toBe('failed');
    expect(failedAttempt?.errorCode).toBe('BAD_REQUEST_ERROR');
    expect(failedAttempt?.errorDescription).toBe('Card payment was declined by issuing bank');

    // Verify order is still pending_payment so customer can retry
    const [orderRecord] = await db.select().from(orders).where(eq(orders.id, orderResult.orderId));
    expect(orderRecord?.status).toBe('pending_payment');
    expect(orderRecord?.paymentStatus).toBe('unpaid');
  });

  it('processes webhook events with idempotency and replay protection', async () => {
    const eventId = `evt_${Date.now()}`;
    let processCounter = 0;

    // First webhook delivery
    const result1 = await recordAndProcessWebhookEvent(db, {
      provider: 'razorpay',
      eventId,
      eventType: 'payment.captured',
      payload: { mock: true, eventId },
      processFn: async () => {
        processCounter++;
      }
    });

    expect(result1.processed).toBe(true);
    expect(result1.duplicate).toBe(false);
    expect(processCounter).toBe(1);

    // Duplicate webhook delivery (e.g. gateway retry or replay attack)
    const result2 = await recordAndProcessWebhookEvent(db, {
      provider: 'razorpay',
      eventId,
      eventType: 'payment.captured',
      payload: { mock: true, eventId },
      processFn: async () => {
        processCounter++;
      }
    });

    expect(result2.processed).toBe(true);
    expect(result2.duplicate).toBe(true);
    expect(processCounter).toBe(1); // Handler was NOT executed a second time!
  });
});
