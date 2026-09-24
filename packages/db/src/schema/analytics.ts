import { relations } from 'drizzle-orm';
import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { stores } from './stores';
import { users } from './users';

export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    storeId: uuid('store_id')
      .notNull()
      .references(() => stores.id, { onDelete: 'cascade' }),
    sessionId: varchar('session_id', { length: 64 }).notNull(),
    anonymousId: varchar('anonymous_id', { length: 64 }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    entityType: varchar('entity_type', { length: 32 }),
    entityId: varchar('entity_id', { length: 64 }),
    properties: jsonb('properties')
      .$type<Record<string, unknown>>()
      .notNull()
      .$defaultFn(() => ({})),
    pageUrl: varchar('page_url', { length: 2048 }),
    referrer: varchar('referrer', { length: 2048 }),
    userAgent: varchar('user_agent', { length: 1024 }),
    ipHash: varchar('ip_hash', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_analytics_events_store_time').on(table.storeId, table.createdAt),
    index('idx_analytics_events_type_time').on(table.eventType, table.createdAt),
    index('idx_analytics_events_session').on(table.sessionId),
    index('idx_analytics_events_user').on(table.userId),
    index('idx_analytics_events_created_at').on(table.createdAt)
  ]
);

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  store: one(stores, {
    fields: [analyticsEvents.storeId],
    references: [stores.id]
  }),
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id]
  })
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
