import { describe, expect, it } from 'vitest';

import {
  generateOrderReceiptToken,
  getReceiptTokenSecret,
  verifyOrderReceiptToken
} from './receipt-token';

describe('Order Receipt Token Utility (E-COM-045, E-COM-143)', () => {
  const orderId = '11111111-2222-3333-4444-555555555555';
  const orderNumber = 'HH-2026-00042';

  it('generates a valid signed HMAC token and verifies successfully', () => {
    const token = generateOrderReceiptToken(orderId, orderNumber);
    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);

    const isValid = verifyOrderReceiptToken(token, orderId, orderNumber);
    expect(isValid).toBe(true);
  });

  it('rejects token when expected orderId differs', () => {
    const token = generateOrderReceiptToken(orderId, orderNumber);
    const isValid = verifyOrderReceiptToken(
      token,
      '99999999-9999-9999-9999-999999999999',
      orderNumber
    );
    expect(isValid).toBe(false);
  });

  it('rejects token when expected orderNumber differs', () => {
    const token = generateOrderReceiptToken(orderId, orderNumber);
    const isValid = verifyOrderReceiptToken(token, orderId, 'HH-2026-DIFFERENT');
    expect(isValid).toBe(false);
  });

  it('rejects token with tampered signature', () => {
    const token = generateOrderReceiptToken(orderId, orderNumber);
    const [id, exp] = token.split('.');
    const tampered = `${id}.${exp}.${'a'.repeat(64)}`;
    const isValid = verifyOrderReceiptToken(tampered, orderId, orderNumber);
    expect(isValid).toBe(false);
  });

  it('rejects expired token', () => {
    // Generated with 100ms TTL
    const token = generateOrderReceiptToken(orderId, orderNumber, { expiresInMs: 100 });
    // Verify in future (+500ms)
    const isValid = verifyOrderReceiptToken(token, orderId, orderNumber, {
      now: Date.now() + 500
    });
    expect(isValid).toBe(false);
  });

  it('rejects malformed token strings', () => {
    expect(verifyOrderReceiptToken('', orderId, orderNumber)).toBe(false);
    expect(verifyOrderReceiptToken('invalid-token', orderId, orderNumber)).toBe(false);
    expect(verifyOrderReceiptToken('part1.part2', orderId, orderNumber)).toBe(false);
    expect(verifyOrderReceiptToken('part1.part2.part3.part4', orderId, orderNumber)).toBe(false);
    expect(verifyOrderReceiptToken(null, orderId, orderNumber)).toBe(false);
    expect(verifyOrderReceiptToken(undefined, orderId, orderNumber)).toBe(false);
  });

  it('uses configured custom secret', () => {
    const customSecret = 'my_super_secret_signing_key_32chars!';
    const token = generateOrderReceiptToken(orderId, orderNumber, { secret: customSecret });

    // Verifies with same secret
    expect(verifyOrderReceiptToken(token, orderId, orderNumber, { secret: customSecret })).toBe(
      true
    );

    // Fails with default secret
    expect(verifyOrderReceiptToken(token, orderId, orderNumber)).toBe(false);
  });

  it('resolves fallback secret in test environment without throwing', () => {
    const secret = getReceiptTokenSecret();
    expect(secret).toBeTruthy();
    expect(secret.length).toBeGreaterThanOrEqual(16);
  });
});
