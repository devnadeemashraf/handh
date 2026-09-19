import crypto from 'node:crypto';

/**
 * Compares two strings in constant time to prevent timing side-channel attacks.
 * Hashes both strings with SHA-256 first so length differences don't leak information.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Verifies admin password in constant time.
 */
export function verifyAdminPassword(inputPassword: string, expectedPassword: string): boolean {
  if (!inputPassword || !expectedPassword) return false;
  return timingSafeStringEqual(inputPassword, expectedPassword);
}

/**
 * Verifies admin access key / stealth gate key in constant time.
 */
export function verifyAdminAccessKey(inputKey: string, expectedKey: string): boolean {
  if (!inputKey || !expectedKey) return false;
  return timingSafeStringEqual(inputKey, expectedKey);
}

export interface AdminSessionPayload {
  role: 'admin';
  createdAt: number;
  expiresAt: number;
  nonce: string;
}

/**
 * Generates a cryptographically signed, tamper-proof session token for admin authentication.
 * Format: base64(payload).signature
 */
export function createAdminSessionToken(secret: string, ttlHours = 12): string {
  const now = Date.now();
  const payload: AdminSessionPayload = {
    role: 'admin',
    createdAt: now,
    expiresAt: now + ttlHours * 60 * 60 * 1000,
    nonce: crypto.randomBytes(16).toString('hex')
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Validates the cryptographic signature and expiration of an admin session token in constant time.
 * Returns true if the token is authentic and non-expired.
 */
export function verifyAdminSessionToken(token: string, secret: string): boolean {
  try {
    if (!token || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadEncoded, signature] = parts;
    if (!payloadEncoded || !signature) return false;

    // Recalculate HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest('base64url');

    // Constant-time signature comparison
    if (!timingSafeStringEqual(signature, expectedSignature)) {
      return false;
    }

    // Decode payload and verify expiration
    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as Partial<AdminSessionPayload>;

    if (payload.role !== 'admin' || typeof payload.expiresAt !== 'number') {
      return false;
    }

    if (Date.now() > payload.expiresAt) {
      return false; // Token expired
    }

    return true;
  } catch {
    return false;
  }
}
