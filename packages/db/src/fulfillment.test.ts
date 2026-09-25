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
  findFulfillmentByReference,
  findFulfillmentsForOrder,
  getAdminOrderMetrics,
  listAdminOrders,
  processShippingWebhookEvent,
  receiveFulfillmentReturn,
  transitionOrderStatus
} from './repositories';
import { inventoryAuditLogs, inventoryLevels, outboxEvents } from './schema';

describe('Fulfillment & Admin Order Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `fulf-test-store-${Date.now()}`;
  let storeId: string;
  let variantId: string;

  beforeAll(async () => {
    // 1. Create test store
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Fulfillment Test Store',
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

    // 3. Create product with initial inventory
    const product = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `fulf-test-np-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Handcrafted Heritage Clip',
      description: 'Signature artisanal nose-piece',
      status: 'published',
      variants: [
        {
          sku: `SKU-FULF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: 'Oxidised Silver Clip',
          priceMinor: 149900,
          currency: 'INR',
          weightGrams: 10,
          initialQuantity: 20,
          sortOrder: 1,
          isActive: true
        }
      ],
      images: []
    });
    variantId = product.variants[0]!.id;
  });

  async function createPaidTestOrder() {
    // 1. Create order
    const checkoutResult = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Fatima Begum',
        email: 'fatima@example.com',
        phone: '9876543210',
        line1: 'Banjara Hills Road No 10',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'IN'
      },
      idempotencyKey: `idemp-fulf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    });

    // 2. Create payment attempt and capture payment to transition to 'paid'
    const providerOrderId = `order_fulf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await createPaymentAttempt(db, {
      orderId: checkoutResult.orderId,
      provider: 'razorpay',
      providerOrderId,
      amountMinor: checkoutResult.totalMinor,
      currency: 'INR'
    });

    await confirmPaymentAndCaptureOrder(db, {
      orderId: checkoutResult.orderId,
      providerOrderId,
      providerPaymentId: `pay_fulf_test_${Date.now()}`,
      providerSignature: 'test_signature_valid'
    });

    return checkoutResult;
  }

  it('records fulfillment, transitions order to shipped, and records outbox event', async () => {
    const orderResult = await createPaidTestOrder();

    // Fulfill the order
    const { fulfillment, order } = await createOrderFulfillment(db, {
      orderId: orderResult.orderId,
      courierProvider: 'dtdc',
      trackingNumber: 'DTDC987654321',
      notes: 'Picked up from Hyderabad workshop'
    });

    expect(fulfillment.id).toBeDefined();
    expect(fulfillment.courierProvider).toBe('dtdc');
    expect(fulfillment.trackingNumber).toBe('DTDC987654321');
    expect(fulfillment.trackingReference).toMatch(/^TRK-\d{4}-[A-Z0-9]{5}$/);
    expect(fulfillment.status).toBe('shipped');

    expect(order.fulfillmentStatus).toBe('shipped');
    expect(order.status).toBe('processing');

    // Verify Outbox Event created
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, order.id));

    const dispatchEvent = events.find((e) => e.eventName === 'order.dispatched');
    expect(dispatchEvent).toBeDefined();
    expect(dispatchEvent?.status).toBe('pending');

    // Verify lookup by tracking reference
    const lookup = await findFulfillmentByReference(db, fulfillment.trackingReference);
    expect(lookup).not.toBeNull();
    expect(lookup?.fulfillment?.id).toBe(fulfillment.id);
    expect(lookup?.order.orderNumber).toBe(order.orderNumber);

    // Verify lookup by order number
    const orderLookup = await findFulfillmentByReference(db, order.orderNumber);
    expect(orderLookup).not.toBeNull();
    expect(orderLookup?.fulfillment?.id).toBe(fulfillment.id);
    expect(orderLookup?.order.id).toBe(order.id);

    // Verify lookup by order ID
    const orderFulfillments = await findFulfillmentsForOrder(db, order.id);
    expect(orderFulfillments.length).toBeGreaterThanOrEqual(1);
    expect(orderFulfillments[0]?.id).toBe(fulfillment.id);
  });

  it('rejects fulfillment of unpaid orders', async () => {
    // Create an order without paying
    const pendingOrder = await createPendingCheckoutOrder(db, {
      storeId,
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Ayesha Khan',
        email: 'ayesha@example.com',
        phone: '9876543211',
        line1: 'Jubilee Hills Road No 36',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500033',
        country: 'IN'
      },
      idempotencyKey: `idemp-unpaid-${Date.now()}`
    });

    await expect(
      createOrderFulfillment(db, {
        orderId: pendingOrder.orderId,
        courierProvider: 'india_post',
        trackingNumber: 'EM123456789IN'
      })
    ).rejects.toThrowError(/Cannot fulfill order in 'pending_payment' status/);
  });

  it('lists admin orders with filters and computes dashboard metrics', async () => {
    const orderResult = await createPaidTestOrder();

    // List all orders for this store
    const ordersList = await listAdminOrders(db, {
      storeId,
      status: 'paid'
    });
    expect(ordersList.length).toBeGreaterThanOrEqual(1);
    expect(ordersList.some((o) => o.id === orderResult.orderId)).toBe(true);

    // Search by customer phone
    const searchResults = await listAdminOrders(db, {
      storeId,
      search: '9876543210'
    });
    expect(searchResults.length).toBeGreaterThanOrEqual(1);

    // Get metrics
    const metrics = await getAdminOrderMetrics(db, storeId);
    expect(metrics.totalOrdersCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalRevenueMinor).toBeGreaterThan(0);
  });

  it('transitions order state according to state machine rules', async () => {
    const orderResult = await createPaidTestOrder();

    // Transition from paid -> processing
    const updatedOrder = await transitionOrderStatus(db, orderResult.orderId, 'processing');
    expect(updatedOrder.status).toBe('processing');

    // Transition from processing -> completed
    const completedOrder = await transitionOrderStatus(db, orderResult.orderId, 'completed');
    expect(completedOrder.status).toBe('completed');

    // Attempt invalid transition completed -> pending_payment (must throw)
    await expect(
      transitionOrderStatus(db, orderResult.orderId, 'pending_payment')
    ).rejects.toThrowError();
  });

  it('processes carrier NDR failed_attempt webhook and emits order.delivery_failed outbox event (E-COM-064)', async () => {
    const orderResult = await createPaidTestOrder();
    const awb = `NDR-${Date.now()}`;
    const { fulfillment, order } = await createOrderFulfillment(db, {
      orderId: orderResult.orderId,
      courierProvider: 'delhivery',
      trackingNumber: awb
    });

    const result = await processShippingWebhookEvent(db, {
      awb,
      providerId: 'delhivery',
      status: 'failed_attempt',
      location: 'Secunderabad Hub',
      description: 'Customer not available at premises',
      rawPayload: { code: 'NDR_01' }
    });

    expect(result.processed).toBe(true);
    expect(result.orderCompleted).toBe(false);

    // Verify fulfillment latestEvent updated
    const updatedFulf = await findFulfillmentByReference(db, fulfillment.trackingReference);
    expect(updatedFulf?.fulfillment?.latestEvent).toContain('Customer not available at premises');

    // Verify outbox event emitted
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, order.id));
    const ndrEvent = events.find((e) => e.eventName === 'order.delivery_failed');
    expect(ndrEvent).toBeDefined();
    expect(ndrEvent?.payload).toMatchObject({
      orderId: order.id,
      awb,
      reason: 'Customer not available at premises',
      location: 'Secunderabad Hub'
    });
  });

  it('processes carrier RTO webhook, updates status to rto, and emits order.rto_initiated outbox event (E-COM-064)', async () => {
    const orderResult = await createPaidTestOrder();
    const awb = `RTO-${Date.now()}`;
    const { fulfillment, order } = await createOrderFulfillment(db, {
      orderId: orderResult.orderId,
      courierProvider: 'dtdc',
      trackingNumber: awb
    });

    const result = await processShippingWebhookEvent(db, {
      awb,
      providerId: 'dtdc',
      status: 'rto',
      location: 'Hyderabad Gateway Hub',
      description: 'Returning to origin after 3 failed delivery attempts'
    });

    expect(result.processed).toBe(true);
    expect(result.orderCompleted).toBe(false);

    // Verify fulfillment status updated to 'rto'
    const updatedFulf = await findFulfillmentByReference(db, fulfillment.trackingReference);
    expect(updatedFulf?.fulfillment?.status).toBe('rto');
    expect(updatedFulf?.fulfillment?.latestEvent).toContain('Returning to origin');

    // Verify outbox event emitted
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, order.id));
    const rtoEvent = events.find((e) => e.eventName === 'order.rto_initiated');
    expect(rtoEvent).toBeDefined();
    expect(rtoEvent?.payload).toMatchObject({
      orderId: order.id,
      awb,
      location: 'Hyderabad Gateway Hub'
    });
  }, 15000);

  it('receives physical return, restocks on-hand inventory with audit log, and sets status to returned (E-COM-064)', async () => {
    const orderResult = await createPaidTestOrder();
    const awb = `RET-${Date.now()}`;
    const { fulfillment, order } = await createOrderFulfillment(db, {
      orderId: orderResult.orderId,
      courierProvider: 'delhivery',
      trackingNumber: awb
    });

    // Check inventory before return
    const [levelBefore] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId));
    const onHandBefore = levelBefore?.onHand ?? 0;

    // Receive warehouse return
    const returnResult = await receiveFulfillmentReturn(db, {
      fulfillmentId: fulfillment.id,
      note: 'Returned package inspected - pristine condition, restocked to shelf A-12'
    });

    expect(returnResult.success).toBe(true);
    expect(returnResult.fulfillmentId).toBe(fulfillment.id);
    expect(returnResult.orderId).toBe(order.id);
    expect(returnResult.restockedItems.length).toBe(1);
    expect(returnResult.restockedItems[0]?.variantId).toBe(variantId);
    expect(returnResult.restockedItems[0]?.quantity).toBe(1);

    // Verify inventory on-hand replenished by 1
    const [levelAfter] = await db
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, variantId));
    expect(levelAfter?.onHand).toBe(onHandBefore + 1);

    // Verify audit log created with reason 'return_restock'
    const auditLogs = await db
      .select()
      .from(inventoryAuditLogs)
      .where(eq(inventoryAuditLogs.variantId, variantId));
    const returnLog = auditLogs.find((l) => l.reason === 'return_restock');
    expect(returnLog).toBeDefined();
    expect(returnLog?.delta).toBe(1);
    expect(returnLog?.note).toContain('pristine condition');

    // Verify fulfillment and order status updated to 'returned'
    const updatedFulf = await findFulfillmentByReference(db, fulfillment.trackingReference);
    expect(updatedFulf?.fulfillment?.status).toBe('returned');
    expect(updatedFulf?.order.fulfillmentStatus).toBe('returned');

    // Verify outbox event emitted
    const events = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, order.id));
    const returnedEvent = events.find((e) => e.eventName === 'fulfillment.returned');
    expect(returnedEvent).toBeDefined();
    expect(returnedEvent?.payload).toMatchObject({
      fulfillmentId: fulfillment.id,
      orderId: order.id
    });

    // Verify double-return is blocked fail-closed
    await expect(
      receiveFulfillmentReturn(db, {
        fulfillmentId: fulfillment.id
      })
    ).rejects.toThrowError(/already been marked as returned and restocked/);
  }, 15000);
});
