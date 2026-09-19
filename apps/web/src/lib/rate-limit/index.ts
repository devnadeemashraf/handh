import { getRedisClient } from '../redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
}

export interface RateLimiter {
  limit(key: string): Promise<RateLimitResult>;
}

export interface RateLimiterOptions {
  windowSeconds: number;
  maxRequests: number;
  prefix?: string;
}

/**
 * In-memory fallback rate limiter for development, tests, or transient Redis outage.
 */
export class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private windowMs: number;
  private maxRequests: number;
  private prefix: string;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowSeconds * 1000;
    this.maxRequests = options.maxRequests;
    this.prefix = options.prefix ?? 'rl:mem:';
  }

  async limit(key: string): Promise<RateLimitResult> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const entry = this.store.get(fullKey);

    if (!entry || entry.resetAt <= now) {
      const resetAt = now + this.windowMs;
      this.store.set(fullKey, { count: 1, resetAt });
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: Math.ceil(resetAt / 1000)
      };
    }

    entry.count += 1;
    const remaining = Math.max(0, this.maxRequests - entry.count);
    return {
      success: entry.count <= this.maxRequests,
      limit: this.maxRequests,
      remaining,
      reset: Math.ceil(entry.resetAt / 1000)
    };
  }
}

/**
 * Production Redis-backed sliding window rate limiter.
 */
export class RedisRateLimiter implements RateLimiter {
  private windowSeconds: number;
  private maxRequests: number;
  private prefix: string;
  private memoryFallback: MemoryRateLimiter;

  constructor(options: RateLimiterOptions) {
    this.windowSeconds = options.windowSeconds;
    this.maxRequests = options.maxRequests;
    this.prefix = options.prefix ?? 'rl:';
    this.memoryFallback = new MemoryRateLimiter(options);
  }

  async limit(key: string): Promise<RateLimitResult> {
    const redis = getRedisClient();
    if (!redis) {
      return this.memoryFallback.limit(key);
    }

    const fullKey = `${this.prefix}${key}`;
    const now = Math.floor(Date.now() / 1000);

    try {
      if (redis.status === 'wait') {
        await redis.connect().catch(() => {});
      }

      // Atomic increment and expiry
      const pipeline = redis.pipeline();
      pipeline.incr(fullKey);
      pipeline.ttl(fullKey);

      const results = await pipeline.exec();
      if (!results || results.length < 2) {
        return this.memoryFallback.limit(key);
      }

      const [incrErr, countResult] = results[0] as [Error | null, number];
      const [ttlErr, ttlResult] = results[1] as [Error | null, number];

      if (incrErr || ttlErr) {
        return this.memoryFallback.limit(key);
      }

      const count = Number(countResult);
      let ttl = Number(ttlResult);

      // If key is newly created (ttl === -1), set expiry
      if (ttl === -1) {
        await redis.expire(fullKey, this.windowSeconds);
        ttl = this.windowSeconds;
      }

      const reset = now + (ttl > 0 ? ttl : this.windowSeconds);
      const remaining = Math.max(0, this.maxRequests - count);

      return {
        success: count <= this.maxRequests,
        limit: this.maxRequests,
        remaining,
        reset
      };
    } catch (error) {
      console.warn('Redis rate limiter encountered an issue; using memory fallback:', error);
      return this.memoryFallback.limit(key);
    }
  }
}

// Pre-configured rate limiters for platform defense
export const otpRequestRateLimiter = new RedisRateLimiter({
  prefix: 'rl:otp:req:',
  windowSeconds: 15 * 60, // 15 minutes
  maxRequests: 5 // 5 OTPs per 15 min window
});

export const otpVerifyRateLimiter = new RedisRateLimiter({
  prefix: 'rl:otp:ver:',
  windowSeconds: 15 * 60, // 15 minutes
  maxRequests: 10 // 10 attempts
});

export const adminLoginRateLimiter = new RedisRateLimiter({
  prefix: 'rl:admin:login:',
  windowSeconds: 15 * 60, // 15 minutes
  maxRequests: 5 // 5 failed password attempts
});

export const checkoutSubmitRateLimiter = new RedisRateLimiter({
  prefix: 'rl:checkout:',
  windowSeconds: 60, // 1 minute
  maxRequests: 10 // 10 requests per minute
});
