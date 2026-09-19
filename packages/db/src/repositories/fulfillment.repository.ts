import { eq, desc } from 'drizzle-orm';
import {
  fulfillments,
  orders,
  outboxEvents,
  type Fulfillment,
  type Order,
  type CourierProvider
} from '../schema';
import {
  generateTrackingReference,
  ValidationError,
  NotFoundError,
  type CreateFulfillmentRequest
} from '@hh/domain';
import type { DatabaseClient } from '../index';

export interface CreateFulfillmentResult {
  fulfillment: Fulfillment;
  order: Order;
}

/**
 * Atomically records a manual shipment fulfillment, transitions order fulfillment status to 'shipped',
 * and registers an asynchronous outbox event for customer dispatch notifications.
 */
export async function createOrderFulfillment(
  db: DatabaseClient,
  params: CreateFulfillmentRequest
): Promise<CreateFulfillmentResult> {
  const { orderId, courierProvider, trackingNumber, notes } = params;

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
        trackingNumber: trackingNumber.trim(),
        trackingReference,
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
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
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
