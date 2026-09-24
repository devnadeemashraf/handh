import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import {
  assertCanTransitionOrder,
  calculateCheckoutFinancials,
  type CheckoutOrderResult,
  type CheckoutSubmissionInput,
  ConflictError,
  type Coupon,
  type CurrencyCode,
  generateOrderNumber,
  type InvoiceData,
  type InvoiceTemplateConfig,
  NotFoundError,
  type OrderStatus,
  resolveInvoiceTemplate,
  validateCoupon,
  ValidationError
} from '@hh/domain';

import {
  coupons,
  fulfillments,
  inventoryLevels,
  inventoryReservations,
  type Order,
  type OrderItem,
  orderItems,
  orders,
  paymentAttempts,
  products,
  productVariants,
  stores
} from '../schema';

import type { DatabaseClient } from '../index';

export interface CreateOrderParams extends Omit<CheckoutSubmissionInput, 'whatsappOptIn'> {
  storeId: string;
  userId?: string | undefined;
  whatsappOptIn?: boolean | undefined;
}

/**
 * Detects whether a database error was triggered by a unique constraint violation
 * on the order idempotency key constraint (unq_orders_store_idempotency).
 */
export function isIdempotencyConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as Record<string, unknown>;
  const code =
    err['code'] ??
    (err['cause'] as Record<string, unknown> | undefined)?.['code'] ??
    (err['originalError'] as Record<string, unknown> | undefined)?.['code'];
  const constraint =
    err['constraint_name'] ??
    (err['cause'] as Record<string, unknown> | undefined)?.['constraint_name'] ??
    err['constraint'] ??
    (err['cause'] as Record<string, unknown> | undefined)?.['constraint'];
  const message = String(err['message'] ?? '');
  const detail = String(
    err['detail'] ?? (err['cause'] as Record<string, unknown> | undefined)?.['detail'] ?? ''
  );

  if (code === '23505') {
    if (constraint === 'unq_orders_store_idempotency') return true;
    if (
      detail.includes('idempotency_key') ||
      message.includes('unq_orders_store_idempotency') ||
      detail.includes('unq_orders_store_idempotency')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Retrieves an order by store ID and client idempotency key.
 */
export async function findOrderByStoreAndIdempotencyKey(
  db: DatabaseClient,
  storeId: string,
  idempotencyKey: string
): Promise<Order | null> {
  const result = await db
    .select()
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.idempotencyKey, idempotencyKey)))
    .limit(1);

  return result[0] ?? null;
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

  // 1. Fast-path Idempotency Check: Look for existing order with this idempotency key
  if (idempotencyKey) {
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
      .where(and(eq(orders.storeId, storeId), eq(orders.idempotencyKey, idempotencyKey)))
      .limit(1);

    if (existingOrder[0]) {
      const existing = existingOrder[0];
      return {
        orderId: existing.id,
        orderNumber: existing.orderNumber,
        currency: (existing.currency as CurrencyCode) || 'INR',
        subtotalMinor: existing.subtotalMinor,
        shippingMinor: existing.shippingMinor,
        totalMinor: existing.totalMinor,
        expiresAt: new Date(new Date(existing.createdAt).getTime() + 15 * 60 * 1000).toISOString()
      };
    }
  }

  try {
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

      // 2. Authoritative Financial Calculations & Optional Coupon Verification
      let appliedCouponCode: string | null = null;
      let discountMinor = 0;

      if (params.couponCode) {
        const normalizedCode = params.couponCode.trim().toUpperCase();
        const couponRows = await tx
          .select()
          .from(coupons)
          .where(and(eq(coupons.storeId, storeId), eq(coupons.code, normalizedCode)))
          .limit(1);

        const couponRecord = couponRows[0];
        if (couponRecord) {
          const domainCoupon: Coupon = {
            id: couponRecord.id,
            code: couponRecord.code,
            discountType: couponRecord.discountType as 'percentage' | 'fixed',
            value: couponRecord.value,
            minOrderValueMinor: couponRecord.minOrderValueMinor,
            maxDiscountMinor: couponRecord.maxDiscountMinor,
            usageLimit: couponRecord.usageLimit,
            timesUsed: couponRecord.timesUsed,
            startsAt: couponRecord.startsAt ? couponRecord.startsAt.toISOString() : null,
            expiresAt: couponRecord.expiresAt ? couponRecord.expiresAt.toISOString() : null,
            isActive: couponRecord.isActive,
            createdAt: couponRecord.createdAt.toISOString()
          };

          const validation = validateCoupon(domainCoupon, { subtotalMinor });
          if (validation.valid) {
            discountMinor = validation.discountMinor;
            appliedCouponCode = domainCoupon.code;
            await tx
              .update(coupons)
              .set({
                timesUsed: sql`${coupons.timesUsed} + 1`,
                updatedAt: new Date()
              })
              .where(eq(coupons.id, domainCoupon.id));
          }
        }
      }

      const financials = calculateCheckoutFinancials(subtotalMinor, 'INR', {
        discountMinor,
        destinationState: shippingAddress.state
      });

      // 3. Generate Order ID & Order Number
      const orderNumber = generateOrderNumber();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minute reservation TTL

      // 4. Create Order Record
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
          userId: params.userId ?? null,
          idempotencyKey: idempotencyKey ?? null,
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
          taxMinor: financials.taxMinor,
          cgstMinor: financials.cgstMinor,
          sgstMinor: financials.sgstMinor,
          igstMinor: financials.igstMinor,
          taxableAmountMinor: financials.taxableAmountMinor,
          couponCode: appliedCouponCode,
          attribution: params.attribution ?? null,
          notes: customerNotes ? customerNotes.trim() : null,
          whatsappOptIn: params.whatsappOptIn ?? true
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
  } catch (error) {
    // If a concurrent request with the same idempotency key committed while this transaction was running,
    // PostgreSQL raises unique constraint violation (23505) on unq_orders_store_idempotency.
    // Fetch and return the committed order instead of failing.
    if (idempotencyKey && isIdempotencyConflict(error)) {
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
        .where(and(eq(orders.storeId, storeId), eq(orders.idempotencyKey, idempotencyKey)))
        .limit(1);

      if (existingOrder[0]) {
        const existing = existingOrder[0];
        return {
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          currency: (existing.currency as CurrencyCode) || 'INR',
          subtotalMinor: existing.subtotalMinor,
          shippingMinor: existing.shippingMinor,
          totalMinor: existing.totalMinor,
          expiresAt: new Date(new Date(existing.createdAt).getTime() + 15 * 60 * 1000).toISOString()
        };
      }
    }

    throw error;
  }
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

/**
 * Resolves complete invoice and thermal packing slip data with customizable brand template.
 */
export async function getOrderInvoiceData(
  db: DatabaseClient,
  orderId: string
): Promise<InvoiceData | null> {
  const orderWithItems = await findOrderById(db, orderId);
  if (!orderWithItems) return null;

  // Find store settings
  const [store] = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(eq(stores.id, orderWithItems.storeId))
    .limit(1);

  const template = resolveInvoiceTemplate(
    (store?.settings as Record<string, unknown> | undefined)?.['invoice']
  );

  // Find latest payment attempt
  const paymentRows = await db
    .select({
      provider: paymentAttempts.provider,
      providerPaymentId: paymentAttempts.providerPaymentId,
      status: paymentAttempts.status
    })
    .from(paymentAttempts)
    .where(eq(paymentAttempts.orderId, orderWithItems.id))
    .orderBy(desc(paymentAttempts.createdAt))
    .limit(1);

  // Find fulfillment if shipped
  const fulfillmentsRows = await db
    .select({
      trackingNumber: fulfillments.trackingNumber,
      courierProvider: fulfillments.courierProvider
    })
    .from(fulfillments)
    .where(eq(fulfillments.orderId, orderWithItems.id))
    .orderBy(desc(fulfillments.createdAt))
    .limit(1);

  const cleanNum = orderWithItems.orderNumber.replace(/[^0-9]/g, '') || orderWithItems.orderNumber;
  const invoiceNumber = `${template.invoicePrefix}${cleanNum}`;

  const invoiceData: InvoiceData = {
    invoiceNumber,
    orderNumber: orderWithItems.orderNumber,
    orderDate: orderWithItems.createdAt.toISOString(),
    paymentStatus: orderWithItems.paymentStatus,
    paymentMethod:
      paymentRows[0]?.provider === 'razorpay'
        ? 'Razorpay Online (UPI / Card / NetBanking)'
        : 'Online Payment',
    fulfillmentStatus: orderWithItems.fulfillmentStatus,
    customer: {
      name: orderWithItems.customerName,
      email: orderWithItems.customerEmail,
      phone: orderWithItems.customerPhone,
      address: {
        line1: orderWithItems.shippingAddress.line1,
        city: orderWithItems.shippingAddress.city,
        state: orderWithItems.shippingAddress.state,
        postalCode: orderWithItems.shippingAddress.postalCode,
        country: orderWithItems.shippingAddress.country
      }
    },
    items: orderWithItems.items.map((it) => ({
      title: it.productNameSnapshot,
      variantTitle: it.variantNameSnapshot,
      sku: it.skuSnapshot,
      quantity: it.quantity,
      unitPriceMinor: Number(it.unitPriceMinor),
      totalMinor: Number(it.totalPriceMinor)
    })),
    subtotalMinor: Number(orderWithItems.subtotalMinor),
    deliveryFeeMinor: Number(orderWithItems.shippingMinor),
    discountMinor: Number(orderWithItems.discountMinor),
    totalAmountMinor: Number(orderWithItems.totalMinor),
    taxMinor: Number(orderWithItems.taxMinor ?? 0),
    cgstMinor: Number(orderWithItems.cgstMinor ?? 0),
    sgstMinor: Number(orderWithItems.sgstMinor ?? 0),
    igstMinor: Number(orderWithItems.igstMinor ?? 0),
    taxableAmountMinor: Number(orderWithItems.taxableAmountMinor ?? 0),
    template
  };

  if (orderWithItems.shippingAddress.line2) {
    invoiceData.customer.address.line2 = orderWithItems.shippingAddress.line2;
  }
  if (paymentRows[0]?.providerPaymentId) {
    invoiceData.paymentId = paymentRows[0].providerPaymentId;
  }
  if (fulfillmentsRows[0]?.trackingNumber) {
    invoiceData.trackingNumber = fulfillmentsRows[0].trackingNumber;
  }
  if (fulfillmentsRows[0]?.courierProvider) {
    invoiceData.courierName = fulfillmentsRows[0].courierProvider.toUpperCase();
  }

  return invoiceData;
}

/**
 * Updates customizable invoice template in store settings.
 */
export async function updateStoreInvoiceSettings(
  db: DatabaseClient,
  storeSlug: string,
  settings: Record<string, unknown>
): Promise<InvoiceTemplateConfig> {
  const [store] = await db.select().from(stores).where(eq(stores.slug, storeSlug)).limit(1);
  if (!store) {
    throw new NotFoundError('Store', storeSlug);
  }

  const currentTemplate = resolveInvoiceTemplate(
    (store.settings as Record<string, unknown> | undefined)?.['invoice']
  );
  const updatedTemplate = resolveInvoiceTemplate({
    ...currentTemplate,
    ...settings
  });

  await db
    .update(stores)
    .set({
      settings: {
        ...store.settings,
        invoice: updatedTemplate
      },
      updatedAt: new Date()
    })
    .where(eq(stores.id, store.id));

  return updatedTemplate;
}

/**
 * Lists all orders placed by a specific authenticated customer.
 */
export async function listOrdersByUserId(
  db: DatabaseClient,
  userId: string
): Promise<Array<Order & { items: OrderItem[] }>> {
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (userOrders.length === 0) return [];

  const orderIds = userOrders.map((o) => o.id);
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));

  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = itemsByOrderId.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrderId.set(item.orderId, list);
  }

  return userOrders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) ?? []
  }));
}
