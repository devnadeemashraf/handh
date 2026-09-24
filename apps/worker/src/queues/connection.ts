import { Redis } from 'ioredis';

import type { RedisOptions } from 'ioredis';

/**
 * Parses a Redis connection URL into typed RedisOptions with BullMQ required defaults.
 * BullMQ requires `maxRetriesPerRequest: null`.
 * Providing connection options rather than a single shared instance ensures
 * BullMQ creates dedicated connections per Queue and Worker, eliminating
 * connection collision and command blocking (E-COM-159).
 */
export function getRedisConnectionOptions(
  redisUrl: string,
  customOptions: Partial<RedisOptions> = {}
): RedisOptions {
  try {
    const parsed = new URL(redisUrl);
    const isTls = parsed.protocol === 'rediss:';
    const dbIndex =
      parsed.pathname && parsed.pathname.length > 1
        ? parseInt(parsed.pathname.slice(1), 10)
        : undefined;

    const baseOptions: RedisOptions = {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        // Exponential backoff with a cap of 2 seconds
        return Math.min(times * 100, 2000);
      }
    };

    if (parsed.username) {
      baseOptions.username = decodeURIComponent(parsed.username);
    }
    if (parsed.password) {
      baseOptions.password = decodeURIComponent(parsed.password);
    }
    if (dbIndex !== undefined && !Number.isNaN(dbIndex)) {
      baseOptions.db = dbIndex;
    }
    if (isTls) {
      baseOptions.tls = {};
    }

    return {
      ...baseOptions,
      ...customOptions
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      },
      ...customOptions
    };
  }
}

/**
 * Creates an isolated Redis connection instance with BullMQ required defaults.
 */
export function createRedisConnection(
  redisUrl: string,
  customOptions: Partial<RedisOptions> = {}
): Redis {
  const options = getRedisConnectionOptions(redisUrl, customOptions);
  const connection = new Redis(options);

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
