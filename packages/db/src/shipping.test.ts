import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  confirmPaymentAndCaptureOrder,
  createCategory,
  createOrderFulfillment,
  createPaymentAttempt,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore,
  findFulfillmentByTrackingNumber,
  processShippingWebhookEvent
} from './repositories';
import { outboxEvents } from './schema';

describe('Shipping & Delivery Webhook Engine', () => {
  const db = createDbClient('postgres://postgres:postgres@localhost:5432/hh_dev');
  let storeId: string;
  let variantId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: `shipping-test-${Date.now()}`,
      name: 'Shipping Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    const category = await createCategory(db, {
      storeId,
      slug: 'accessories',
      name: 'Accessories',
      sortOrder: 1,
      isActive: true
    });

    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `ship-clip-${Date.now()}`,
      title: 'Handcrafted Clip',
      description: 'Artisanal nose-piece',
      status: 'published',
      variants: [
        {
          sku: `SKU-SHIP-${Date.now()}`,
          title: 'Silver Clip',
          priceMinor: 250000,
          currency: 'INR',
          weightGrams: 10,
          initialQuantity: 25,
          sortOrder: 1,
          isActive: true
        }
      ],
      images: []
    });
    variantId = product.variants[0]!.id;
  });

  it(
    'records automated doorstep pickup fulfillment and processes delivery webhook',
    async () => {
    // 1. Create and pay for an order
    const pending = await createPendingCheckoutOrder(db, {
      storeId,
      idempotencyKey: randomUUID(),
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Sameera Bano',
        email: 'sameera@example.com',
        phone: '9876543210',
        line1: 'Banjara Hills Road 12',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'IN'
      }
    });

    const providerOrderId = `order_ship_${Date.now()}`;
    await createPaymentAttempt(db, {
      orderId: pending.orderId,
      provider: 'razorpay',
      providerOrderId,
      amountMinor: pending.totalMinor,
      currency: 'INR'
    });

    await confirmPaymentAndCaptureOrder(db, {
      orderId: pending.orderId,
      providerOrderId,
      providerPaymentId: `pay_ship_${Date.now()}`,
      providerSignature: 'test_sig_valid'
    });

    // 2. Book doorstep pickup fulfillment
    const awbNumber = `SR_TEST_${Date.now()}`;
    const pickupResult = await createOrderFulfillment(db, {
      orderId: pending.orderId,
      courierProvider: 'delhivery',
      shippingProviderId: 'shiprocket',
      trackingNumber: awbNumber,
      labelUrl: `https://shiprocket.co/mock-labels/${awbNumber}.pdf`,
      pickupToken: `PICKUP-${pending.orderNumber}`,
      notes: 'Fragile jewelry box dispatched via Shiprocket'
    });

    expect(pickupResult.fulfillment.trackingNumber).toBe(awbNumber);
    expect(pickupResult.fulfillment.shippingProviderId).toBe('shiprocket');
    expect(pickupResult.fulfillment.labelUrl).toContain('.pdf');
    expect(pickupResult.fulfillment.status).toBe('shipped');
    expect(pickupResult.order.fulfillmentStatus).toBe('shipped');

    // 3. Verify lookup by tracking number
    const lookup = await findFulfillmentByTrackingNumber(db, awbNumber);
    expect(lookup).not.toBeNull();
    expect(lookup?.fulfillment.id).toBe(pickupResult.fulfillment.id);

    // 4. Simulate intermediate webhook event (Out for Delivery)
    const intermediate = await processShippingWebhookEvent(db, {
      awb: awbNumber,
      providerId: 'shiprocket',
      status: 'out_for_delivery',
      timestamp: new Date(),
      location: 'Hyderabad South DC',
      description: 'Out with courier delivery associate',
      rawPayload: {}
    });

    expect(intermediate.processed).toBe(true);
    expect(intermediate.orderCompleted).toBe(false);

    // 5. Simulate final webhook event (Delivered)
    const deliveryTime = new Date();
    const finalEvent = await processShippingWebhookEvent(db, {
      awb: awbNumber,
      providerId: 'shiprocket',
      status: 'delivered',
      timestamp: deliveryTime,
      location: 'Customer Doorstep, Hyderabad',
      description: 'Delivered to Sameera Bano',
      rawPayload: {}
    });

    expect(finalEvent.processed).toBe(true);
    expect(finalEvent.orderCompleted).toBe(true);

    // 6. Verify order completed in database
    const updatedLookup = await findFulfillmentByTrackingNumber(db, awbNumber);
    expect(updatedLookup?.fulfillment.status).toBe('delivered');
    expect(updatedLookup?.fulfillment.latestEvent).toBe('Delivered to Sameera Bano');
    expect(updatedLookup?.order.status).toBe('completed');

    // 7. Verify outbox event emitted
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, pending.orderId));

    const deliveredEvent = events.find((e) => e.eventName === 'order.delivered');
    expect(deliveredEvent).toBeDefined();
    expect(deliveredEvent?.status).toBe('pending');
  }, 15000);

  it('handles unknown AWB gracefully without throwing', async () => {
    const res = await processShippingWebhookEvent(db, {
      awb: 'NON_EXISTENT_AWB_123',
      providerId: 'manual',
      status: 'delivered'
    });

    expect(res.processed).toBe(false);
    expect(res.reason).toContain('No fulfillment record found');
  });
});
