import crypto from 'node:crypto';

/**
 * Resolves the signing secret for order receipt and payment authorization tokens.
 * Prioritizes ORDER_RECEIPT_SECRET, then ADMIN_SESSION_SECRET, with a secure fallback for test/dev.
 */
export function getReceiptTokenSecret(): string {
  const secret =
    process.env['ORDER_RECEIPT_SECRET'] ||
    process.env['ADMIN_SESSION_SECRET'] ||
    (process.env['NODE_ENV'] === 'test' ? 'test_receipt_secret_min_32_characters_long_12345' : '');

  if (!secret) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(
        'ORDER_RECEIPT_SECRET or ADMIN_SESSION_SECRET must be configured in production.'
      );
    }
    return 'dev_receipt_secret_min_32_characters_long_12345';
  }
  return secret;
}

const DEFAULT_RECEIPT_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generates a cryptographically signed HMAC token for an order.
 * Format: `${orderId}.${exp}.${signature}`
 */
export function generateOrderReceiptToken(
  orderId: string,
  orderNumber: string,
  options?: { expiresInMs?: number; secret?: string }
): string {
  const ttl = options?.expiresInMs ?? DEFAULT_RECEIPT_TOKEN_TTL_MS;
  const exp = Date.now() + ttl;
  const secret = options?.secret || getReceiptTokenSecret();

  const payload = `${orderId}:${orderNumber}:${exp}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return `${orderId}.${exp}.${signature}`;
}

/**
 * Verifies an order receipt token against the expected orderId and orderNumber.
 * Enforces constant-time comparison, format validation, and expiration check.
 */
export function verifyOrderReceiptToken(
  token: string | null | undefined,
  expectedOrderId: string,
  expectedOrderNumber: string,
  options?: { secret?: string; now?: number }
): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [orderId, expStr, signature] = parts;
  if (!orderId || !expStr || !signature) {
    return false;
  }

  if (orderId !== expectedOrderId) {
    return false;
  }

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || exp <= 0) {
    return false;
  }

  const now = options?.now ?? Date.now();
  if (now > exp) {
    return false;
  }

  if (!/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  try {
    const secret = options?.secret || getReceiptTokenSecret();
    const payload = `${expectedOrderId}:${expectedOrderNumber}:${exp}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const actualBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
