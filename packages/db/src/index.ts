import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

export * from './schema';
export { schema };

export type DatabaseClient = ReturnType<typeof createDbClient>;

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
