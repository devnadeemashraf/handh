import { and, count, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { analyticsEvents } from '../schema/analytics';

import type { DatabaseClient, DbTransaction } from '../index';
import type { AnalyticsEvent, NewAnalyticsEvent } from '../schema/analytics';

export interface ListAnalyticsEventsFilter {
  storeId?: string;
  eventType?: string;
  sessionId?: string;
  userId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  offset?: number;
}

export interface FunnelMetrics {
  pageViews: number;
  productViews: number;
  cartAdds: number;
  checkoutsInitiated: number;
  ordersCompleted: number;
}

export async function insertAnalyticsEvent(
  db: DatabaseClient | DbTransaction,
  event: NewAnalyticsEvent
): Promise<AnalyticsEvent> {
  const [created] = await db.insert(analyticsEvents).values(event).returning();
  if (!created) {
    throw new Error('Failed to insert analytics event');
  }
  return created;
}

export async function insertAnalyticsEventsBatch(
  db: DatabaseClient | DbTransaction,
  events: NewAnalyticsEvent[]
): Promise<AnalyticsEvent[]> {
  if (events.length === 0) {
    return [];
  }
  return db.insert(analyticsEvents).values(events).returning();
}

export async function listAnalyticsEvents(
  db: DatabaseClient | DbTransaction,
  filter: ListAnalyticsEventsFilter = {}
): Promise<AnalyticsEvent[]> {
  const conditions = [];

  if (filter.storeId) {
    conditions.push(eq(analyticsEvents.storeId, filter.storeId));
  }
  if (filter.eventType) {
    conditions.push(eq(analyticsEvents.eventType, filter.eventType));
  }
  if (filter.sessionId) {
    conditions.push(eq(analyticsEvents.sessionId, filter.sessionId));
  }
  if (filter.userId) {
    conditions.push(eq(analyticsEvents.userId, filter.userId));
  }
  if (filter.since) {
    conditions.push(gte(analyticsEvents.createdAt, filter.since));
  }
  if (filter.until) {
    conditions.push(lte(analyticsEvents.createdAt, filter.until));
  }

  const query = db
    .select()
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(filter.limit ?? 100);

  if (filter.offset) {
    query.offset(filter.offset);
  }

  return query;
}

export async function countAnalyticsEvents(
  db: DatabaseClient | DbTransaction,
  filter: Omit<ListAnalyticsEventsFilter, 'limit' | 'offset'> = {}
): Promise<number> {
  const conditions = [];

  if (filter.storeId) {
    conditions.push(eq(analyticsEvents.storeId, filter.storeId));
  }
  if (filter.eventType) {
    conditions.push(eq(analyticsEvents.eventType, filter.eventType));
  }
  if (filter.sessionId) {
    conditions.push(eq(analyticsEvents.sessionId, filter.sessionId));
  }
  if (filter.userId) {
    conditions.push(eq(analyticsEvents.userId, filter.userId));
  }
  if (filter.since) {
    conditions.push(gte(analyticsEvents.createdAt, filter.since));
  }
  if (filter.until) {
    conditions.push(lte(analyticsEvents.createdAt, filter.until));
  }

  const [result] = await db
    .select({ total: count() })
    .from(analyticsEvents)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return Number(result?.total ?? 0);
}

export async function getFunnelMetrics(
  db: DatabaseClient | DbTransaction,
  params: { storeId: string; since?: Date }
): Promise<FunnelMetrics> {
  const conditions = [eq(analyticsEvents.storeId, params.storeId)];
  if (params.since) {
    conditions.push(gte(analyticsEvents.createdAt, params.since));
  }

  const rows = await db
    .select({
      eventType: analyticsEvents.eventType,
      count: sql<number>`count(*)::int`
    })
    .from(analyticsEvents)
    .where(and(...conditions))
    .groupBy(analyticsEvents.eventType);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.eventType] = Number(row.count);
  }

  return {
    pageViews: counts['page_viewed'] ?? 0,
    productViews: counts['product_viewed'] ?? 0,
    cartAdds: counts['cart_item_added'] ?? 0,
    checkoutsInitiated: (counts['checkout_initiated'] ?? 0) + (counts['checkout_started'] ?? 0),
    ordersCompleted: counts['order_completed'] ?? 0
  };
}
