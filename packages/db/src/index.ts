import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

export type DatabaseClient = ReturnType<typeof createDbClient>;

/**
 * Creates a configured PostgreSQL connection pool wrapped with Drizzle ORM.
 * Connection pooling limits and idle timeouts are configured for production stability.
 */
export function createDbClient(databaseUrl: string) {
  const queryClient = postgres(databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10
  });

  return drizzle(queryClient);
}
