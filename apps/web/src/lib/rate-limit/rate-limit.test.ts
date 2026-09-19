import { describe, expect, it } from 'vitest';

import { MemoryRateLimiter } from './index';

describe('RateLimiter', () => {
  it('allows requests within threshold and blocks excess requests', async () => {
    const limiter = new MemoryRateLimiter({
      windowSeconds: 60,
      maxRequests: 3,
      prefix: 'test:'
    });

    const key = 'user_ip_1';

    const res1 = await limiter.limit(key);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await limiter.limit(key);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await limiter.limit(key);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = await limiter.limit(key);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it('maintains independent rate counters for different keys', async () => {
    const limiter = new MemoryRateLimiter({
      windowSeconds: 60,
      maxRequests: 2,
      prefix: 'test:'
    });

    await limiter.limit('key_a');
    await limiter.limit('key_a');
    const blockedA = await limiter.limit('key_a');
    expect(blockedA.success).toBe(false);

    const allowedB = await limiter.limit('key_b');
    expect(allowedB.success).toBe(true);
    expect(allowedB.remaining).toBe(1);
  });
});
