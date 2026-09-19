import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import type { WebhookStatus } from '@hh/domain';

import { orders } from './orders';
export type { WebhookStatus };
export type PaymentAttemptStatus = 'initiated' | 'authorized' | 'captured' | 'failed';

export const paymentAttempts = pgTable(
  'payment_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 32 }).notNull().default('razorpay'),
    providerOrderId: varchar('provider_order_id', { length: 128 }).notNull(),
    providerPaymentId: varchar('provider_payment_id', { length: 128 }),
    providerSignature: varchar('provider_signature', { length: 255 }),
    amountMinor: bigint('amount_minor', { mode: 'number' }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    status: varchar('status', { length: 32 })
      .$type<PaymentAttemptStatus>()
      .notNull()
      .default('initiated'),
    errorCode: varchar('error_code', { length: 64 }),
    errorDescription: text('error_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_payment_attempt_amount_positive', sql`${table.amountMinor} > 0`),
    index('idx_payment_attempts_order_id').on(table.orderId),
    index('idx_payment_attempts_provider_order').on(table.providerOrderId),
    index('idx_payment_attempts_provider_payment').on(table.providerPaymentId)
  ]
);

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provider: varchar('provider', { length: 32 }).notNull(),
    eventId: varchar('event_id', { length: 128 }).notNull(),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    payload: jsonb('payload').notNull(),
    status: varchar('status', { length: 32 }).$type<WebhookStatus>().notNull().default('pending'),
    errorMessage: text('error_message'),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true })
  },
  (table) => [
    unique('uq_webhook_events_provider_event').on(table.provider, table.eventId),
    index('idx_webhook_events_status').on(table.status)
  ]
);

export const paymentAttemptsRelations = relations(paymentAttempts, ({ one }) => ({
  order: one(orders, {
    fields: [paymentAttempts.orderId],
    references: [orders.id]
  })
}));

export type PaymentAttempt = typeof paymentAttempts.$inferSelect;
export type NewPaymentAttempt = typeof paymentAttempts.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
