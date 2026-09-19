import { eq, and, inArray, sql, or, ilike, desc } from 'drizzle-orm';
import {
  orders,
  orderItems,
  productVariants,
  products,
  inventoryLevels,
  inventoryReservations,
  type Order,
  type OrderItem
} from '../schema';
import {
  calculateCheckoutFinancials,
  generateOrderNumber,
  ConflictError,
  ValidationError,
  NotFoundError,
  assertCanTransitionOrder,
  type OrderStatus,
  type CheckoutSubmissionInput,
  type CheckoutOrderResult
} from '@hh/domain';
import type { DatabaseClient } from '../index';

export interface CreateOrderParams extends CheckoutSubmissionInput {
  storeId: string;
}

/**
 * Atomically validates inventory with row-locking, creates inventory reservations,
 * and records a pending order with historical line item snapshots.
 */
export async function createPendingCheckoutOrder(
  db: DatabaseClient,
  params: CreateOrderParams
): Promise<CheckoutOrderResult> {
  const { storeId, items, shippingAddress, customerNotes, idempotencyKey } = params;

  if (items.length === 0) {
    throw new ValidationError('Checkout cannot be processed with an empty cart.');
  }

  // Idempotency check: Look for existing order with this idempotency key
  const idempotencyTag = `[idempotency:${idempotencyKey}]`;
  const existingOrder = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      currency: orders.currency,
      subtotalMinor: orders.subtotalMinor,
      shippingMinor: orders.shippingMinor,
      totalMinor: orders.totalMinor,
      createdAt: orders.createdAt
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), sql`${orders.notes} LIKE ${`%${idempotencyTag}%`}`))
    .limit(1);

  if (existingOrder[0]) {
    const existing = existingOrder[0];
    return {
      orderId: existing.id,
      orderNumber: existing.orderNumber,
      currency: 'INR',
      subtotalMinor: existing.subtotalMinor,
      shippingMinor: existing.shippingMinor,
      totalMinor: existing.totalMinor,
      expiresAt: new Date(new Date(existing.createdAt).getTime() + 15 * 60 * 1000).toISOString()
    };
  }

  return await db.transaction(async (tx) => {
    const variantIds = items.map((i) => i.variantId);

    // 1. Lock and fetch inventory & variant rows concurrently using FOR UPDATE
    const variantRows = await tx
      .select({
        variantId: productVariants.id,
        sku: productVariants.sku,
        variantTitle: productVariants.title,
        priceMinor: productVariants.priceMinor,
        isVariantActive: productVariants.isActive,
        productId: products.id,
        productTitle: products.title,
        productStatus: products.status,
        inventoryId: inventoryLevels.id,
        onHand: inventoryLevels.onHand,
        reserved: inventoryLevels.reserved
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(inventoryLevels, eq(productVariants.id, inventoryLevels.variantId))
      .where(
        and(
          inArray(productVariants.id, variantIds),
          eq(products.storeId, storeId),
          eq(products.status, 'published'),
          eq(productVariants.isActive, true)
        )
      )
      .for('update', { of: inventoryLevels });

    const variantMap = new Map<string, (typeof variantRows)[number]>();
    for (const row of variantRows) {
      variantMap.set(row.variantId, row);
    }

    // Verify all requested variants exist, are active, and have sufficient inventory
    let subtotalMinor = 0;

    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new NotFoundError('ProductVariant', item.variantId, {
          reason: 'Product piece is no longer available or was unpublished'
        });
      }

      const available = Math.max(0, variant.onHand - variant.reserved);
      if (available < item.quantity) {
        throw new ConflictError(
          `Insufficient stock for "${variant.productTitle} (${variant.variantTitle})". Requested: ${item.quantity}, Available: ${available}`,
          {
            variantId: item.variantId,
            requested: item.quantity,
            available
          }
        );
      }

      subtotalMinor += variant.priceMinor * item.quantity;
    }

    // 2. Authoritative Financial Calculations
    const financials = calculateCheckoutFinancials(subtotalMinor, 'INR');

    // 3. Generate Order ID & Order Number
    const orderNumber = generateOrderNumber();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minute reservation TTL

    // 4. Create Order Record
    const notesContent = customerNotes ? `${idempotencyTag} ${customerNotes}` : idempotencyTag;

    const shippingAddressPayload = {
      line1: shippingAddress.line1,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      ...(shippingAddress.line2 ? { line2: shippingAddress.line2 } : {})
    };

    const [createdOrder] = await tx
      .insert(orders)
      .values({
        orderNumber,
        storeId,
        status: 'pending_payment',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        customerEmail: shippingAddress.email,
        customerPhone: shippingAddress.phone,
        customerName: shippingAddress.fullName,
        shippingAddress: shippingAddressPayload,
        currency: 'INR',
        subtotalMinor: financials.subtotalMinor,
        shippingMinor: financials.shippingMinor,
        discountMinor: financials.discountMinor,
        totalMinor: financials.totalMinor,
        notes: notesContent
      })
      .returning();

    const orderId = createdOrder!.id;

    // 5. Create Order Items & Inventory Reservations
    for (const item of items) {
      const variant = variantMap.get(item.variantId)!;
      const lineTotalMinor = variant.priceMinor * item.quantity;

      // Create snapshot line item
      await tx.insert(orderItems).values({
        orderId,
        variantId: variant.variantId,
        skuSnapshot: variant.sku,
        productNameSnapshot: variant.productTitle,
        variantNameSnapshot: variant.variantTitle,
        unitPriceMinor: variant.priceMinor,
        quantity: item.quantity,
        totalPriceMinor: lineTotalMinor
      });

      // Create inventory reservation record
      await tx.insert(inventoryReservations).values({
        orderId,
        variantId: variant.variantId,
        quantity: item.quantity,
        status: 'active',
        expiresAt
      });

      // Increment reserved units atomically
      await tx
        .update(inventoryLevels)
        .set({
          reserved: sql`${inventoryLevels.reserved} + ${item.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(inventoryLevels.variantId, variant.variantId));
    }

    return {
      orderId,
      orderNumber: createdOrder!.orderNumber,
      currency: 'INR',
      subtotalMinor: financials.subtotalMinor,
      shippingMinor: financials.shippingMinor,
      totalMinor: financials.totalMinor,
      expiresAt: expiresAt.toISOString()
    };
  });
}

/**
 * Retrieves an order by ID with its line items.
 */
export async function findOrderById(
  db: DatabaseClient,
  orderId: string
): Promise<(Order & { items: OrderItem[] }) | null> {
  const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = orderRows[0];
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return {
    ...order,
    items
  };
}

/**
 * Retrieves an order by public order number.
 */
export async function findOrderByOrderNumber(
  db: DatabaseClient,
  orderNumber: string
): Promise<(Order & { items: OrderItem[] }) | null> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  const order = orderRows[0];
  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return {
    ...order,
    items
  };
}

export interface ListAdminOrdersOptions {
  storeId?: string;
  status?: OrderStatus | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lists orders for admin management with status filtering, search, and pagination.
 */
export async function listAdminOrders(
  db: DatabaseClient,
  options: ListAdminOrdersOptions = {}
): Promise<Array<Order & { itemCount: number }>> {
  const { storeId, status = 'all', search, limit = 50, offset = 0 } = options;

  const conditions = [];

  if (storeId) {
    conditions.push(eq(orders.storeId, storeId));
  }

  if (status && status !== 'all') {
    conditions.push(eq(orders.status, status));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, term),
        ilike(orders.customerName, term),
        ilike(orders.customerEmail, term),
        ilike(orders.customerPhone, term)
      )
    );
  }

  let query = db
    .select({
      order: orders,
      itemCount: sql<number>`cast(count(${orderItems.id}) as integer)`
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const orderRows = await query
    .groupBy(orders.id)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  return orderRows.map((r) => ({
    ...r.order,
    itemCount: r.itemCount
  }));
}

export interface AdminOrderMetrics {
  totalRevenueMinor: number;
  toPackCount: number;
  processingCount: number;
  shippedCount: number;
  totalOrdersCount: number;
}

/**
 * Aggregates administrative order KPIs and queue metrics.
 */
export async function getAdminOrderMetrics(
  db: DatabaseClient,
  storeId?: string
): Promise<AdminOrderMetrics> {
  let query = db
    .select({
      totalRevenueMinor: sql<number>`coalesce(sum(case when ${orders.paymentStatus} = 'captured' then ${orders.totalMinor} else 0 end), 0)`,
      toPackCount: sql<number>`count(case when ${orders.status} = 'paid' and ${orders.fulfillmentStatus} = 'unfulfilled' then 1 end)`,
      processingCount: sql<number>`count(case when ${orders.status} = 'processing' then 1 end)`,
      shippedCount: sql<number>`count(case when ${orders.fulfillmentStatus} = 'shipped' then 1 end)`,
      totalOrdersCount: sql<number>`count(${orders.id})`
    })
    .from(orders);

  if (storeId) {
    query = query.where(eq(orders.storeId, storeId)) as typeof query;
  }

  const rows = await query;
  const stats = rows[0]!;
  return {
    totalRevenueMinor: Number(stats.totalRevenueMinor),
    toPackCount: Number(stats.toPackCount),
    processingCount: Number(stats.processingCount),
    shippedCount: Number(stats.shippedCount),
    totalOrdersCount: Number(stats.totalOrdersCount)
  };
}

/**
 * Transitions an order's status enforcing strict state machine rules.
 */
export async function transitionOrderStatus(
  db: DatabaseClient,
  orderId: string,
  newStatus: OrderStatus
): Promise<Order> {
  return await db.transaction(async (tx) => {
    const existingRows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');

    const order = existingRows[0];
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    assertCanTransitionOrder(order.status, newStatus);

    const updatedRows = await tx
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updatedRows[0]!;
  });
}
