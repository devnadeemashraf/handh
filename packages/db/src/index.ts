import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export * from './repositories';
export * from './schema';
export * from './services';
export * from './test-db-helper';
export { schema };
export { sql } from 'drizzle-orm';

export type DatabaseClient = ReturnType<typeof createDbClient>;
export type DbTransaction = Parameters<Parameters<DatabaseClient['transaction']>[0]>[0];

/**
 * Creates a configured PostgreSQL connection pool wrapped with Drizzle ORM
 * with the complete H&H schema attached.
 */
export function createDbClient(databaseUrl: string, options: Parameters<typeof postgres>[1] = {}) {
  const queryClient = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ...options
  });

  return drizzle(queryClient, { schema });
}

const globalForDb = globalThis as unknown as {
  hhPostgresClients?: Map<string, { queryClient: ReturnType<typeof postgres>; db: DatabaseClient }>;
};

/**
 * Returns a cached, shared PostgreSQL connection pool wrapped with Drizzle ORM.
 * Prevents connection starvation, socket exhaustion, and latency spikes across concurrent requests.
 */
export function getSharedDbClient(
  databaseUrl: string,
  options: Parameters<typeof postgres>[1] = {}
): DatabaseClient {
  if (!globalForDb.hhPostgresClients) {
    globalForDb.hhPostgresClients = new Map();
  }

  const existing = globalForDb.hhPostgresClients.get(databaseUrl);
  if (existing) {
    return existing.db;
  }

  const db = createDbClient(databaseUrl, options);
  // Store reference in connection cache
  globalForDb.hhPostgresClients.set(databaseUrl, {
    queryClient: (db as unknown as { session: { client: ReturnType<typeof postgres> } })?.session
      ?.client,
    db
  });
  return db;
}

/**
 * Closes an individual database client connection pool.
 */
export async function closeDbClient(db: DatabaseClient): Promise<void> {
  const client = (
    db as unknown as { $client?: { end: (opts?: { timeout?: number }) => Promise<void> } }
  ).$client;
  if (client && typeof client.end === 'function') {
    await client.end({ timeout: 5 });
  }
}

/**
 * Closes all cached shared PostgreSQL connection pools.
 * Useful for test lifecycle teardown and graceful worker shutdown.
 */
export async function closeSharedDbClients(): Promise<void> {
  if (!globalForDb.hhPostgresClients) {
    return;
  }

  const entries = Array.from(globalForDb.hhPostgresClients.values());
  globalForDb.hhPostgresClients.clear();

  await Promise.all(
    entries.map(async ({ queryClient }) => {
      if (queryClient && typeof queryClient.end === 'function') {
        await queryClient.end({ timeout: 5 });
      }
    })
  );
}
