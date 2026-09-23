import { describe, expect, it } from 'vitest';

import { verifySecretTimingSafe } from './crypto';

describe('Shipping Webhook Crypto Timing-Safe Comparison (E-COM-071)', () => {
  it('returns true when secrets match exactly', () => {
    expect(verifySecretTimingSafe('my_secret_token_123', 'my_secret_token_123')).toBe(true);
  });

  it('returns false when secrets differ in content', () => {
    expect(verifySecretTimingSafe('my_secret_token_123', 'my_secret_token_124')).toBe(false);
    expect(verifySecretTimingSafe('attacker_forgery', 'legitimate_secret')).toBe(false);
  });

  it('returns false when secrets differ in length', () => {
    expect(verifySecretTimingSafe('short', 'longer_secret')).toBe(false);
    expect(verifySecretTimingSafe('longer_secret', 'short')).toBe(false);
  });

  it('returns false when either secret is null or undefined', () => {
    expect(verifySecretTimingSafe(undefined, 'secret')).toBe(false);
    expect(verifySecretTimingSafe('secret', undefined)).toBe(false);
    expect(verifySecretTimingSafe(null, 'secret')).toBe(false);
    expect(verifySecretTimingSafe('secret', null)).toBe(false);
    expect(verifySecretTimingSafe(undefined, undefined)).toBe(false);
  });

  it('returns false when either secret is empty string', () => {
    expect(verifySecretTimingSafe('', 'secret')).toBe(false);
    expect(verifySecretTimingSafe('secret', '')).toBe(false);
    expect(verifySecretTimingSafe('', '')).toBe(false);
  });
});
