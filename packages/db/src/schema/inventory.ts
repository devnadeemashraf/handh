import { relations, sql } from 'drizzle-orm';
import { check, index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import type { InventoryAuditReason, ReservationStatus } from '@hh/domain';

import { orders } from './orders';
import { productVariants } from './products';
export type { InventoryAuditReason, ReservationStatus };

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
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
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
    index('idx_inventory_reservations_cleanup').on(table.status, table.expiresAt),
    index('idx_inventory_reservations_order_status').on(table.orderId, table.status)
  ]
);

export const inventoryAuditLogs = pgTable(
  'inventory_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    previousOnHand: integer('previous_on_hand').notNull(),
    newOnHand: integer('new_on_hand').notNull(),
    delta: integer('delta').notNull(),
    reason: varchar('reason', { length: 64 }).$type<InventoryAuditReason>().notNull(),
    note: varchar('note', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('idx_inventory_audit_variant_created').on(table.variantId, table.createdAt)]
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
  }),
  order: one(orders, {
    fields: [inventoryReservations.orderId],
    references: [orders.id]
  })
}));

export const inventoryAuditLogsRelations = relations(inventoryAuditLogs, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryAuditLogs.variantId],
    references: [productVariants.id]
  })
}));

export type InventoryLevel = typeof inventoryLevels.$inferSelect;
export type NewInventoryLevel = typeof inventoryLevels.$inferInsert;
export type InventoryReservation = typeof inventoryReservations.$inferSelect;
export type NewInventoryReservation = typeof inventoryReservations.$inferInsert;
export type InventoryAuditLog = typeof inventoryAuditLogs.$inferSelect;
export type NewInventoryAuditLog = typeof inventoryAuditLogs.$inferInsert;
