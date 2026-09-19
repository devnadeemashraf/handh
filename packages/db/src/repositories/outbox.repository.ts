import { and, asc, eq, lte } from 'drizzle-orm';

import { type NewOutboxEvent, type OutboxEvent, outboxEvents } from '../schema/outbox';

import type { DatabaseClient, DbTransaction } from '../index';

export interface MarkOutboxEventFailedOptions {
  maxRetries?: number | undefined;
  baseBackoffSeconds?: number | undefined;
}

/**
 * Inserts a new outbox event record.
 */
export async function insertOutboxEvent(
  db: DatabaseClient | DbTransaction,
  event: NewOutboxEvent
): Promise<OutboxEvent> {
  const [inserted] = await db.insert(outboxEvents).values(event).returning();

  if (!inserted) {
    throw new Error('Failed to insert outbox event.');
  }

  return inserted;
}

/**
 * Fetches pending outbox events whose scheduledAt has arrived.
 * Orders by scheduledAt ascending (oldest first).
 */
export async function fetchPendingOutboxEvents(
  db: DatabaseClient,
  limit = 50
): Promise<OutboxEvent[]> {
  const now = new Date();

  return await db
    .select()
    .from(outboxEvents)
    .where(and(eq(outboxEvents.status, 'pending'), lte(outboxEvents.scheduledAt, now)))
    .orderBy(asc(outboxEvents.scheduledAt))
    .limit(limit);
}

/**
 * Finds an outbox event by primary key ID.
 */
export async function findOutboxEventById(
  db: DatabaseClient,
  id: string
): Promise<OutboxEvent | null> {
  const rows = await db.select().from(outboxEvents).where(eq(outboxEvents.id, id)).limit(1);

  return rows[0] ?? null;
}

/**
 * Marks an outbox event as published/processed.
 */
export async function markOutboxEventPublished(
  db: DatabaseClient | DbTransaction,
  id: string
): Promise<OutboxEvent | null> {
  const [updated] = await db
    .update(outboxEvents)
    .set({
      status: 'published',
      processedAt: new Date(),
      errorMessage: null
    })
    .where(eq(outboxEvents.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Marks an outbox event as failed.
 * If retryCount is below maxRetries (default: 5), calculates exponential backoff and leaves status as 'pending'.
 * If retries are exhausted, sets status to 'failed'.
 */
export async function markOutboxEventFailed(
  db: DatabaseClient | DbTransaction,
  id: string,
  errorMessage: string,
  options: MarkOutboxEventFailedOptions = {}
): Promise<OutboxEvent | null> {
  const { maxRetries = 5, baseBackoffSeconds = 15 } = options;

  const existing = await db
    .select({ retryCount: outboxEvents.retryCount })
    .from(outboxEvents)
    .where(eq(outboxEvents.id, id))
    .limit(1);

  const currentRetries = existing[0]?.retryCount ?? 0;
  const newRetryCount = currentRetries + 1;

  if (newRetryCount >= maxRetries) {
    const [updated] = await db
      .update(outboxEvents)
      .set({
        status: 'failed',
        retryCount: newRetryCount,
        processedAt: new Date(),
        errorMessage
      })
      .where(eq(outboxEvents.id, id))
      .returning();

    return updated ?? null;
  }

  // Calculate exponential backoff delay (15s, 30s, 60s, 120s...)
  const delaySeconds = baseBackoffSeconds * Math.pow(2, currentRetries);
  const nextScheduledAt = new Date(Date.now() + delaySeconds * 1000);

  const [updated] = await db
    .update(outboxEvents)
    .set({
      status: 'pending',
      retryCount: newRetryCount,
      scheduledAt: nextScheduledAt,
      errorMessage: `${errorMessage} (attempt ${newRetryCount})`
    })
    .where(eq(outboxEvents.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Marks all currently pending outbox events as published.
 * Useful for test suites and maintenance cleanup.
 */
export async function cleanPendingOutboxEvents(db: DatabaseClient): Promise<number> {
  const updated = await db
    .update(outboxEvents)
    .set({
      status: 'published',
      processedAt: new Date()
    })
    .where(eq(outboxEvents.status, 'pending'))
    .returning();

  return updated.length;
}
