import { pgTable, uuid, varchar, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { stores } from './stores';

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id),
    code: varchar('code', { length: 32 }).notNull(),
    discountType: varchar('discount_type', { length: 16 }).notNull(), // 'percentage' | 'fixed'
    value: integer('value').notNull(), // percent (e.g. 10) or minor units (e.g. 10000 paise)
    minOrderValueMinor: integer('min_order_value_minor').notNull().default(0),
    maxDiscountMinor: integer('max_discount_minor'),
    usageLimit: integer('usage_limit'),
    timesUsed: integer('times_used').notNull().default(0),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('coupons_store_code_idx').on(table.storeId, table.code)]
);

export type CouponRecord = typeof coupons.$inferSelect;
export type InsertCouponRecord = typeof coupons.$inferInsert;
