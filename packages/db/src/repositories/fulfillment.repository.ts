import { desc, eq } from 'drizzle-orm';

import { generateTrackingReference, NotFoundError, ValidationError } from '@hh/domain';

import {
  type CourierProvider,
  type Fulfillment,
  fulfillments,
  type Order,
  orders,
  outboxEvents
} from '../schema';

import type { DatabaseClient } from '../index';

export interface CreateOrderFulfillmentOptions {
  orderId: string;
  courierProvider: CourierProvider;
  trackingNumber: string;
  shippingProviderId?: string | undefined;
  labelUrl?: string | undefined;
  pickupToken?: string | undefined;
  notes?: string | undefined;
}

export interface CreateOrderFulfillmentResult {
  fulfillment: Fulfillment;
  order: Order;
}

/**
 * Atomically records a shipment fulfillment (manual drop-off or doorstep pickup),
 * transitions order fulfillment status to 'shipped', and registers an asynchronous
 * outbox event for customer dispatch notifications.
 */
export async function createOrderFulfillment(
  db: DatabaseClient,
  params: CreateOrderFulfillmentOptions
): Promise<CreateOrderFulfillmentResult> {
  const {
    orderId,
    courierProvider,
    trackingNumber,
    shippingProviderId = 'manual',
    labelUrl,
    pickupToken,
    notes
  } = params;

  return await db.transaction(async (tx) => {
    // 1. Fetch order with row-lock
    const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');

    const order = orderRows[0];
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    // 2. State validation: can only fulfill paid or processing orders
    if (order.status !== 'paid' && order.status !== 'processing') {
      throw new ValidationError(
        `Cannot fulfill order in '${order.status}' status. Order must be paid or processing.`
      );
    }

    // 3. Generate unique tracking reference
    const trackingReference = generateTrackingReference();

    // 4. Create fulfillment entry
    const createdFulfillments = await tx
      .insert(fulfillments)
      .values({
        orderId: order.id,
        courierProvider: courierProvider as CourierProvider,
        shippingProviderId,
        trackingNumber: trackingNumber.trim(),
        trackingReference,
        labelUrl: labelUrl ?? null,
        pickupToken: pickupToken ?? null,
        status: 'shipped',
        shippedAt: new Date(),
        notes: notes ? notes.trim() : null
      })
      .returning();

    const fulfillment = createdFulfillments[0]!;

    // 5. Update order state
    const nextOrderStatus = order.status === 'paid' ? 'processing' : order.status;
    const updatedOrders = await tx
      .update(orders)
      .set({
        fulfillmentStatus: 'shipped',
        status: nextOrderStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id))
      .returning();

    const updatedOrder = updatedOrders[0]!;

    // 6. Record outbox event for transactional customer notification
    await tx.insert(outboxEvents).values({
      eventName: 'order.dispatched',
      aggregateType: 'order',
      aggregateId: order.id,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        courierProvider,
        trackingNumber: trackingNumber.trim(),
        trackingReference,
        shippingProviderId,
        labelUrl: labelUrl ?? null,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        userId: order.userId,
        shippedAt: fulfillment.shippedAt.toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    return {
      fulfillment,
      order: updatedOrder
    };
  });
}

/**
 * Finds fulfillment details and associated order by courier tracking number (AWB).
 */
export async function findFulfillmentByTrackingNumber(
  db: DatabaseClient,
  trackingNumber: string
): Promise<{ fulfillment: Fulfillment; order: Order } | null> {
  const cleanAwb = trackingNumber.trim();
  const rows = await db
    .select({
      fulfillment: fulfillments,
      order: orders
    })
    .from(fulfillments)
    .innerJoin(orders, eq(fulfillments.orderId, orders.id))
    .where(eq(fulfillments.trackingNumber, cleanAwb))
    .orderBy(desc(fulfillments.createdAt))
    .limit(1);

  if (!rows[0]) return null;

  return {
    fulfillment: rows[0].fulfillment,
    order: rows[0].order
  };
}

/**
 * Processes an incoming normalized shipping webhook event.
 * Automatically updates fulfillment milestone scan status, and if the parcel is
 * marked 'delivered', atomically completes the order and writes an Outbox event.
 */
export async function processShippingWebhookEvent(
  db: DatabaseClient,
  event: {
    awb: string;
    providerId: string;
    status:
      'manifested' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed_attempt' | 'rto';
    timestamp?: Date | undefined;
    location?: string | undefined;
    description?: string | undefined;
    rawPayload?: Record<string, unknown> | undefined;
  }
): Promise<{
  processed: boolean;
  orderCompleted: boolean;
  fulfillmentId?: string | undefined;
  orderId?: string | undefined;
  reason?: string | undefined;
}> {
  return await db.transaction(async (tx) => {
    // 1. Locate fulfillment by AWB with row lock
    const lookup = await tx
      .select({
        fulfillment: fulfillments,
        order: orders
      })
      .from(fulfillments)
      .innerJoin(orders, eq(fulfillments.orderId, orders.id))
      .where(eq(fulfillments.trackingNumber, event.awb.trim()))
      .for('update')
      .limit(1);

    if (!lookup[0]) {
      return {
        processed: false,
        orderCompleted: false,
        reason: `No fulfillment record found matching AWB: '${event.awb}'`
      };
    }

    const { fulfillment, order } = lookup[0];

    // 2. Determine new status
    const isDelivered = event.status === 'delivered';
    const newFulfillmentStatus = isDelivered ? 'delivered' : fulfillment.status;
    const deliveredAt = isDelivered ? (event.timestamp ?? new Date()) : fulfillment.deliveredAt;

    // 3. Update fulfillment milestone
    await tx
      .update(fulfillments)
      .set({
        status: newFulfillmentStatus,
        deliveredAt,
        latestEvent: event.description || event.location || event.status,
        rawWebhookPayload: event.rawPayload ? JSON.stringify(event.rawPayload) : null,
        updatedAt: new Date()
      })
      .where(eq(fulfillments.id, fulfillment.id));

    // 4. If delivered, transition order to 'completed'
    let orderCompleted = false;
    if (isDelivered && order.status !== 'completed') {
      await tx
        .update(orders)
        .set({
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, order.id));

      orderCompleted = true;

      // 5. Emit transactional outbox event
      await tx.insert(outboxEvents).values({
        eventName: 'order.delivered',
        aggregateType: 'order',
        aggregateId: order.id,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          fulfillmentId: fulfillment.id,
          awb: event.awb,
          providerId: event.providerId,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          userId: order.userId,
          deliveredAt: (deliveredAt ?? new Date()).toISOString()
        },
        status: 'pending',
        scheduledAt: new Date()
      });
    }

    return {
      processed: true,
      orderCompleted,
      fulfillmentId: fulfillment.id,
      orderId: order.id
    };
  });
}

/**
 * Finds fulfillment details and associated order by either public tracking reference
 * (e.g. TRK-2026-XXXXX) or public order number (e.g. HH-2026-XXXXX).
 * If the order exists but hasn't been fulfilled yet, returns { fulfillment: null, order }.
 */
export async function findFulfillmentByReference(
  db: DatabaseClient,
  referenceOrOrderNumber: string
): Promise<{ fulfillment: Fulfillment | null; order: Order } | null> {
  const query = referenceOrOrderNumber.trim();

  // 1. Try finding by tracking reference first
  const rows = await db
    .select({
      fulfillment: fulfillments,
      order: orders
    })
    .from(fulfillments)
    .innerJoin(orders, eq(fulfillments.orderId, orders.id))
    .where(eq(fulfillments.trackingReference, query))
    .limit(1);

  if (rows[0]) {
    return {
      fulfillment: rows[0].fulfillment,
      order: rows[0].order
    };
  }

  // 2. Try finding by public order number (e.g. right after checkout)
  const orderRows = await db.select().from(orders).where(eq(orders.orderNumber, query)).limit(1);

  const order = orderRows[0];
  if (!order) return null;

  // Check if any fulfillment exists for this order
  const orderFulfillments = await db
    .select()
    .from(fulfillments)
    .where(eq(fulfillments.orderId, order.id))
    .orderBy(desc(fulfillments.createdAt))
    .limit(1);

  return {
    fulfillment: orderFulfillments[0] ?? null,
    order
  };
}

/**
 * Retrieves all fulfillment records created for a specific order.
 */
export async function findFulfillmentsForOrder(
  db: DatabaseClient,
  orderId: string
): Promise<Fulfillment[]> {
  return await db
    .select()
    .from(fulfillments)
    .where(eq(fulfillments.orderId, orderId))
    .orderBy(desc(fulfillments.createdAt));
}
