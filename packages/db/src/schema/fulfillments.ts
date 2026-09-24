import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { orders } from './orders';

export type CourierProvider = 'india_post' | 'dtdc' | 'delhivery' | 'bluedart' | 'other';
export type FulfillmentRecordStatus = 'shipped' | 'delivered' | 'rto' | 'returned';

export const fulfillments = pgTable(
  'fulfillments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'restrict' }),
    courierProvider: varchar('courier_provider', { length: 32 }).$type<CourierProvider>().notNull(),
    trackingNumber: varchar('tracking_number', { length: 128 }).notNull(),
    trackingReference: varchar('tracking_reference', { length: 64 }).notNull().unique(),
    status: varchar('status', { length: 32 })
      .$type<FulfillmentRecordStatus>()
      .notNull()
      .default('shipped'),
    shippingProviderId: varchar('shipping_provider_id', { length: 32 }).notNull().default('manual'),
    labelUrl: text('label_url'),
    pickupToken: varchar('pickup_token', { length: 128 }),
    latestEvent: text('latest_event'),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    rawWebhookPayload: text('raw_webhook_payload'),
    shippedAt: timestamp('shipped_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_fulfillments_order_id').on(table.orderId),
    index('idx_fulfillments_tracking_reference').on(table.trackingReference),
    index('idx_fulfillments_tracking_number').on(table.trackingNumber)
  ]
);

export const fulfillmentsRelations = relations(fulfillments, ({ one }) => ({
  order: one(orders, {
    fields: [fulfillments.orderId],
    references: [orders.id]
  })
}));

export type Fulfillment = typeof fulfillments.$inferSelect;
export type NewFulfillment = typeof fulfillments.$inferInsert;
