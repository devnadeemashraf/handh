import { Redis } from 'ioredis';

import type { RedisOptions } from 'ioredis';

/**
 * Creates a configured Redis connection for BullMQ.
 * BullMQ requires `maxRetriesPerRequest: null`.
 */
export function createRedisConnection(
  redisUrl: string,
  customOptions: Partial<RedisOptions> = {}
): Redis {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      // Exponential backoff with a cap of 2 seconds
      return Math.min(times * 100, 2000);
    },
    ...customOptions
  });

  connection.on('error', (err) => {
    // Only log, do not crash worker on transient reconnects
    console.error(
      JSON.stringify({
        level: 'warn',
        message: 'Redis connection transient error',
        error: err instanceof Error ? err.message : String(err)
      })
    );
  });

  return connection;
}
