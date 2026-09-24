import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import type { FulfillmentStatus, OrderAttribution, OrderStatus, PaymentStatus } from '@hh/domain';

import { productVariants } from './products';
import { stores } from './stores';
import { users } from './users';
export type { FulfillmentStatus, OrderAttribution, OrderStatus, PaymentStatus };

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 32 }).notNull().unique(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    idempotencyKey: varchar('idempotency_key', { length: 128 }),
    status: varchar('status', { length: 32 })
      .$type<OrderStatus>()
      .notNull()
      .default('pending_payment'),
    paymentStatus: varchar('payment_status', { length: 32 })
      .$type<PaymentStatus>()
      .notNull()
      .default('unpaid'),
    fulfillmentStatus: varchar('fulfillment_status', { length: 32 })
      .$type<FulfillmentStatus>()
      .notNull()
      .default('unfulfilled'),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 32 }).notNull(),
    customerName: varchar('customer_name', { length: 128 }).notNull(),
    shippingAddress: jsonb('shipping_address').$type<ShippingAddress>().notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    subtotalMinor: bigint('subtotal_minor', { mode: 'number' }).notNull(),
    shippingMinor: bigint('shipping_minor', { mode: 'number' }).notNull().default(0),
    discountMinor: bigint('discount_minor', { mode: 'number' }).notNull().default(0),
    totalMinor: bigint('total_minor', { mode: 'number' }).notNull(),
    taxMinor: bigint('tax_minor', { mode: 'number' }).notNull().default(0),
    cgstMinor: bigint('cgst_minor', { mode: 'number' }).notNull().default(0),
    sgstMinor: bigint('sgst_minor', { mode: 'number' }).notNull().default(0),
    igstMinor: bigint('igst_minor', { mode: 'number' }).notNull().default(0),
    taxableAmountMinor: bigint('taxable_amount_minor', { mode: 'number' }).notNull().default(0),
    couponCode: varchar('coupon_code', { length: 32 }),
    attribution: jsonb('attribution').$type<OrderAttribution>(),
    notes: text('notes'),
    whatsappOptIn: boolean('whatsapp_opt_in').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_orders_subtotal_minor', sql`${table.subtotalMinor} >= 0`),
    check('chk_orders_shipping_minor', sql`${table.shippingMinor} >= 0`),
    check('chk_orders_discount_minor', sql`${table.discountMinor} >= 0`),
    check('chk_orders_total_minor', sql`${table.totalMinor} >= 0`),
    check('chk_orders_tax_minor', sql`${table.taxMinor} >= 0`),
    check('chk_orders_cgst_minor', sql`${table.cgstMinor} >= 0`),
    check('chk_orders_sgst_minor', sql`${table.sgstMinor} >= 0`),
    check('chk_orders_igst_minor', sql`${table.igstMinor} >= 0`),
    check('chk_orders_taxable_amount_minor', sql`${table.taxableAmountMinor} >= 0`),
    unique('unq_orders_store_idempotency').on(table.storeId, table.idempotencyKey),
    index('idx_orders_customer_email').on(table.customerEmail),
    index('idx_orders_user_id').on(table.userId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_created_at').on(table.createdAt)
  ]
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    skuSnapshot: varchar('sku_snapshot', { length: 64 }).notNull(),
    productNameSnapshot: varchar('product_name_snapshot', { length: 255 }).notNull(),
    variantNameSnapshot: varchar('variant_name_snapshot', { length: 128 }).notNull(),
    unitPriceMinor: bigint('unit_price_minor', { mode: 'number' }).notNull(),
    quantity: integer('quantity').notNull(),
    totalPriceMinor: bigint('total_price_minor', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_order_items_unit_price', sql`${table.unitPriceMinor} >= 0`),
    check('chk_order_items_quantity', sql`${table.quantity} > 0`),
    check('chk_order_items_total_price', sql`${table.totalPriceMinor} >= 0`),
    index('idx_order_items_order_id').on(table.orderId)
  ]
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id]
  }),
  items: many(orderItems)
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id]
  })
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
