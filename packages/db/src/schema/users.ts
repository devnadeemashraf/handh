import {
  boolean,
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

import type { FamilyPreferences, OTPPurpose, UserRole } from '@hh/domain';

import { products, productVariants } from './products';
import { stores } from './stores';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    phone: varchar('phone', { length: 32 }).notNull(),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    email: varchar('email', { length: 255 }),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: varchar('name', { length: 128 }),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    role: varchar('role', { length: 32 }).$type<UserRole>().notNull().default('customer'),
    whatsappOptIn: boolean('whatsapp_opt_in').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique('unq_users_store_phone').on(table.storeId, table.phone),
    index('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role)
  ]
);

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export const otpCodes = pgTable(
  'otp_codes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phone: varchar('phone', { length: 32 }).notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    purpose: varchar('purpose', { length: 32 }).$type<OTPPurpose>().notNull().default('login'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    attempts: integer('attempts').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('idx_otp_codes_phone_purpose').on(table.phone, table.purpose, table.expiresAt)]
);

export type OTPCodeRecord = typeof otpCodes.$inferSelect;
export type NewOTPCodeRecord = typeof otpCodes.$inferInsert;

export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_user_sessions_user_id').on(table.userId),
    index('idx_user_sessions_expires_at').on(table.expiresAt)
  ]
);

export type UserSessionRecord = typeof userSessions.$inferSelect;
export type NewUserSessionRecord = typeof userSessions.$inferInsert;

export const userAddresses = pgTable(
  'user_addresses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 64 }).notNull().default('Home'),
    recipientName: varchar('recipient_name', { length: 128 }).notNull(),
    phone: varchar('phone', { length: 32 }).notNull(),
    line1: varchar('line1', { length: 255 }).notNull(),
    line2: varchar('line2', { length: 255 }),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 16 }).notNull(),
    country: varchar('country', { length: 2 }).notNull().default('IN'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('idx_user_addresses_user_id').on(table.userId)]
);

export type UserAddressRecord = typeof userAddresses.$inferSelect;
export type NewUserAddressRecord = typeof userAddresses.$inferInsert;

export const familyMembers = pgTable(
  'family_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 128 }).notNull(),
    relationship: varchar('relationship', { length: 64 }),
    preferences: jsonb('preferences').$type<FamilyPreferences>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index('idx_family_members_user_id').on(table.userId)]
);

export type FamilyMemberRecord = typeof familyMembers.$inferSelect;
export type NewFamilyMemberRecord = typeof familyMembers.$inferInsert;

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique('unq_wishlist_user_product').on(table.userId, table.productId),
    index('idx_wishlist_items_user_id').on(table.userId)
  ]
);

export type WishlistItemRecord = typeof wishlistItems.$inferSelect;
export type NewWishlistItemRecord = typeof wishlistItems.$inferInsert;
