import { pgTable, uuid, integer, varchar, timestamp, check, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { productVariants } from './products';

import type { ReservationStatus } from '@hh/domain';
export type { ReservationStatus };

export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id')
      .notNull()
      .unique()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_inventory_on_hand_non_negative', sql`${table.onHand} >= 0`),
    check('chk_inventory_reserved_non_negative', sql`${table.reserved} >= 0`),
    check('chk_inventory_no_overselling', sql`${table.reserved} <= ${table.onHand}`)
  ]
);

export const inventoryReservations = pgTable(
  'inventory_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    status: varchar('status', { length: 32 })
      .$type<ReservationStatus>()
      .notNull()
      .default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_reservation_quantity_positive', sql`${table.quantity} > 0`),
    index('idx_inventory_reservations_cleanup').on(table.status, table.expiresAt)
  ]
);

export const inventoryLevelsRelations = relations(inventoryLevels, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryLevels.variantId],
    references: [productVariants.id]
  })
}));

export const inventoryReservationsRelations = relations(inventoryReservations, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryReservations.variantId],
    references: [productVariants.id]
  })
}));

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;
export type InventoryReservation = typeof inventoryReservations.$inferSelect;
export type NewInventoryReservation = typeof inventoryReservations.$inferInsert;
