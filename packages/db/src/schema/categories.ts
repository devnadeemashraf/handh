import { relations } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { stores } from './stores';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    parentId: uuid('parent_id'),
    path: varchar('path', { length: 512 }).notNull().default(''),
    depth: integer('depth').notNull().default(0),
    applicableFilterKeys: jsonb('applicable_filter_keys').$type<string[]>().default([]),
    slug: varchar('slug', { length: 128 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique('uq_categories_store_slug').on(table.storeId, table.slug),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: 'fk_categories_parent'
    }).onDelete('restrict')
  ]
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  store: one(stores, {
    fields: [categories.storeId],
    references: [stores.id]
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories'
  }),
  subcategories: many(categories, {
    relationName: 'subcategories'
  })
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
