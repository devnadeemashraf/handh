import { Redis } from 'ioredis';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  if (redisInstance) return redisInstance;

  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

  try {
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 100, 1000);
      }
    });

    redisInstance.on('error', (err) => {
      // Gracefully log transient Redis connection warning
      if (process.env.NODE_ENV !== 'test') {
        console.warn(
          'Redis client transient warning:',
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    return redisInstance;
  } catch (error) {
    console.warn('Failed to initialize Redis client:', error);
    return null;
  }
}
