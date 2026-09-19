import { relations } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import type { InvoiceTemplateConfig, ServiceControlConfig, StorefrontConfig } from '@hh/domain';

export interface StoreSettings {
  contactEmail?: string | undefined;
  supportPhone?: string | undefined;
  instagramHandle?: string | undefined;
  orderNotificationEmails?: string[] | undefined;
  enableCoupons?: boolean | undefined;
  storefront?: StorefrontConfig | undefined;
  invoice?: InvoiceTemplateConfig | undefined;
  serviceControl?: ServiceControlConfig | undefined;
}

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  description: text('description'),
  defaultCurrency: varchar('default_currency', { length: 3 }).notNull().default('INR'),
  isActive: boolean('is_active').notNull().default(true),
  settings: jsonb('settings').$type<StoreSettings>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const storeDomains = pgTable('store_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id')
    .notNull()
    .references(() => stores.id, { onDelete: 'cascade' }),
  hostname: varchar('hostname', { length: 255 }).notNull().unique(),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const storesRelations = relations(stores, ({ many }) => ({
  domains: many(storeDomains)
}));

export const storeDomainsRelations = relations(storeDomains, ({ one }) => ({
  store: one(stores, {
    fields: [storeDomains.storeId],
    references: [stores.id]
  })
}));

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
export type StoreDomain = typeof storeDomains.$inferSelect;
export type NewStoreDomain = typeof storeDomains.$inferInsert;
