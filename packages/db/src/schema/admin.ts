import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

import type { AdminRole } from '@hh/domain';

import { stores } from './stores';

/**
 * Enterprise Admin Users table.
 * Physically distinct from customer accounts to prevent privilege confusion.
 */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'restrict' }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 128 }).notNull(),
    passwordHash: text('password_hash'), // Nullable if SSO-only administrator
    role: varchar('role', { length: 32 }).$type<AdminRole>().notNull().default('admin'),
    isActive: boolean('is_active').notNull().default(true),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_admin_users_email').on(table.email),
    index('idx_admin_users_role').on(table.role)
  ]
);

export type AdminUserRecord = typeof adminUsers.$inferSelect;
export type NewAdminUserRecord = typeof adminUsers.$inferInsert;

/**
 * Enterprise Admin Sessions table.
 * Supports concurrent session tracking, limits (max 5 active), and server-side revocation.
 */
export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => adminUsers.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_admin_sessions_admin_id').on(table.adminId),
    index('idx_admin_sessions_expires_at').on(table.expiresAt)
  ]
);

export type AdminSessionRecord = typeof adminSessions.$inferSelect;
export type NewAdminSessionRecord = typeof adminSessions.$inferInsert;

/**
 * Enterprise Admin Audit Logs table.
 * Guarantees 100% traceability for all administrative actions, logins, lockouts,
 * privilege changes, and destructive/financial mutations.
 */
export const adminAuditLogs = pgTable(
  'admin_audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    adminEmail: varchar('admin_email', { length: 255 }).notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 128 }),
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_admin_audit_logs_admin_id').on(table.adminId),
    index('idx_admin_audit_logs_action').on(table.action),
    index('idx_admin_audit_logs_entity').on(table.entityType, table.entityId),
    index('idx_admin_audit_logs_created_at').on(table.createdAt)
  ]
);

export type AdminAuditLogRecord = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLogRecord = typeof adminAuditLogs.$inferInsert;

// Relations
export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  store: one(stores, {
    fields: [adminUsers.storeId],
    references: [stores.id]
  }),
  sessions: many(adminSessions),
  auditLogs: many(adminAuditLogs)
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminSessions.adminId],
    references: [adminUsers.id]
  })
}));

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminAuditLogs.adminId],
    references: [adminUsers.id]
  })
}));
