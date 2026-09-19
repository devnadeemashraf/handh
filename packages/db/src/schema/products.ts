import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import { categories } from './categories';
import { stores } from './stores';

export type ProductStatus = 'draft' | 'published' | 'archived';

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    department: varchar('department', { length: 64 }).notNull().default('unisex'),
    slug: varchar('slug', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull().default(''),
    status: varchar('status', { length: 32 }).$type<ProductStatus>().notNull().default('draft'),
    isCustomizable: boolean('is_customizable').notNull().default(false),
    customizationConfig: jsonb('customization_config').$type<Record<string, unknown>>(),
    specifications: jsonb('specifications')
      .$type<Record<string, string | number | boolean>>()
      .$defaultFn(() => ({})),
    tags: jsonb('tags')
      .$type<string[]>()
      .$defaultFn(() => []),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [unique('uq_products_store_slug').on(table.storeId, table.slug)]
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 64 }).notNull().unique(),
    title: varchar('title', { length: 128 }).notNull(),
    options: jsonb('options')
      .$type<{ name: string; value: string }[]>()
      .$defaultFn(() => []),
    priceMinor: bigint('price_minor', { mode: 'number' }).notNull(),
    compareAtPriceMinor: bigint('compare_at_price_minor', { mode: 'number' }),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    weightGrams: integer('weight_grams').notNull().default(0),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    check('chk_variant_price_minor', sql`${table.priceMinor} >= 0`),
    check(
      'chk_variant_compare_at_price_minor',
      sql`${table.compareAtPriceMinor} IS NULL OR ${table.compareAtPriceMinor} >= 0`
    )
  ]
);

export const productImages = pgTable('product_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  storageKey: varchar('storage_key', { length: 512 }).notNull(),
  url: varchar('url', { length: 1024 }).notNull(),
  altText: varchar('alt_text', { length: 255 }).notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id]
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  variants: many(productVariants),
  images: many(productImages)
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id]
  }),
  images: many(productImages)
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id]
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id]
  })
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
