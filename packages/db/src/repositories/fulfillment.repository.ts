import { desc, eq } from 'drizzle-orm';

import { generateTrackingReference, NotFoundError, ValidationError } from '@hh/domain';

import {
  type CourierProvider,
  type Fulfillment,
  type FulfillmentRecordStatus,
  fulfillments,
  type Order,
  orderItems,
  orders,
  outboxEvents
} from '../schema';
import { adjustStock } from './inventory.repository';

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
        whatsappOptIn: order.whatsappOptIn,
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
    const isRto = event.status === 'rto';
    const isFailedAttempt = event.status === 'failed_attempt';

    let newFulfillmentStatus: FulfillmentRecordStatus = fulfillment.status;
    if (isDelivered) {
      newFulfillmentStatus = 'delivered';
    } else if (isRto) {
      newFulfillmentStatus = 'rto';
    }

    const deliveredAt = isDelivered ? (event.timestamp ?? new Date()) : fulfillment.deliveredAt;
    const latestEventDescription =
      event.description ||
      (isFailedAttempt
        ? event.location
          ? `Delivery attempt failed at ${event.location}`
          : 'Delivery attempt failed (NDR)'
        : isRto
          ? event.location
            ? `Return to Origin (RTO) initiated at ${event.location}`
            : 'Return to Origin (RTO) initiated by courier'
          : event.location || event.status);

    // 3. Update fulfillment milestone
    await tx
      .update(fulfillments)
      .set({
        status: newFulfillmentStatus,
        deliveredAt,
        latestEvent: latestEventDescription,
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
          whatsappOptIn: order.whatsappOptIn,
          deliveredAt: (deliveredAt ?? new Date()).toISOString()
        },
        status: 'pending',
        scheduledAt: new Date()
      });
    } else if (isFailedAttempt) {
      // Emit NDR outbox event
      await tx.insert(outboxEvents).values({
        eventName: 'order.delivery_failed',
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
          whatsappOptIn: order.whatsappOptIn,
          reason: latestEventDescription,
          location: event.location,
          failedAt: (event.timestamp ?? new Date()).toISOString()
        },
        status: 'pending',
        scheduledAt: new Date()
      });
    } else if (isRto) {
      // Emit RTO initiated outbox event
      await tx.insert(outboxEvents).values({
        eventName: 'order.rto_initiated',
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
          whatsappOptIn: order.whatsappOptIn,
          reason: latestEventDescription,
          location: event.location,
          rtoInitiatedAt: (event.timestamp ?? new Date()).toISOString()
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

export interface ReceiveFulfillmentReturnParams {
  fulfillmentId: string;
  note?: string | undefined;
  restock?: boolean | undefined;
}

export interface ReceiveFulfillmentReturnResult {
  success: boolean;
  fulfillmentId: string;
  orderId: string;
  restockedItems: Array<{
    variantId: string;
    sku: string;
    productTitle: string;
    quantity: number;
  }>;
}

/**
 * Handles physical warehouse return intake (E-COM-064).
 * Idempotently restocks inventory to on-hand levels, updates fulfillment status to 'returned',
 * sets order fulfillmentStatus to 'returned', and emits 'fulfillment.returned' outbox event.
 */
export async function receiveFulfillmentReturn(
  db: DatabaseClient,
  params: ReceiveFulfillmentReturnParams
): Promise<ReceiveFulfillmentReturnResult> {
  const shouldRestock = params.restock ?? true;

  return await db.transaction(async (tx) => {
    // 1. Locate fulfillment with row lock
    const lookup = await tx
      .select({
        fulfillment: fulfillments,
        order: orders
      })
      .from(fulfillments)
      .innerJoin(orders, eq(fulfillments.orderId, orders.id))
      .where(eq(fulfillments.id, params.fulfillmentId))
      .for('update')
      .limit(1);

    if (!lookup[0]) {
      throw new NotFoundError('Fulfillment', params.fulfillmentId);
    }

    const { fulfillment, order } = lookup[0];

    // 2. Prevent duplicate return intake
    if (fulfillment.status === 'returned') {
      throw new ValidationError(
        `Fulfillment '${fulfillment.trackingReference}' has already been marked as returned and restocked.`
      );
    }

    // 3. Retrieve order items to restock
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    const restockedItems: Array<{
      variantId: string;
      sku: string;
      productTitle: string;
      quantity: number;
    }> = [];

    if (shouldRestock) {
      for (const item of items) {
        if (item.variantId) {
          await adjustStock(tx, {
            variantId: item.variantId,
            delta: item.quantity,
            reason: 'return_restock',
            note:
              params.note ??
              `Return intake for order #${order.orderNumber} (AWB: ${fulfillment.trackingNumber})`
          });

          restockedItems.push({
            variantId: item.variantId,
            sku: item.skuSnapshot,
            productTitle: item.productNameSnapshot,
            quantity: item.quantity
          });
        }
      }
    }

    // 4. Update fulfillment status to 'returned'
    const returnNote =
      params.note ??
      `Physical return received at warehouse (restocked ${restockedItems.reduce((acc, i) => acc + i.quantity, 0)} units)`;

    await tx
      .update(fulfillments)
      .set({
        status: 'returned',
        latestEvent: returnNote,
        updatedAt: new Date()
      })
      .where(eq(fulfillments.id, fulfillment.id));

    // 5. Update order fulfillment status to 'returned'
    await tx
      .update(orders)
      .set({
        fulfillmentStatus: 'returned',
        updatedAt: new Date()
      })
      .where(eq(orders.id, order.id));

    // 6. Emit outbox event
    await tx.insert(outboxEvents).values({
      eventName: 'fulfillment.returned',
      aggregateType: 'order',
      aggregateId: order.id,
      payload: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        fulfillmentId: fulfillment.id,
        awb: fulfillment.trackingNumber,
        courierProvider: fulfillment.courierProvider,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        userId: order.userId,
        whatsappOptIn: order.whatsappOptIn,
        restockedItems,
        receivedAt: new Date().toISOString(),
        note: returnNote
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    return {
      success: true,
      fulfillmentId: fulfillment.id,
      orderId: order.id,
      restockedItems
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
