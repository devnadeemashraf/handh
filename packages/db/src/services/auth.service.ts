import crypto from 'node:crypto';

import { OTP_CONFIG, SESSION_CONFIG } from '@hh/domain';

import type { UserRole } from '@hh/domain';

export function generateOTP(): string {
  const min = Math.pow(10, OTP_CONFIG.length - 1);
  const max = Math.pow(10, OTP_CONFIG.length);
  return crypto.randomInt(min, max).toString();
}

export function verifyOTP(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  const cleanInput = input.trim();
  const cleanExpected = expected.trim();
  if (cleanInput.length !== OTP_CONFIG.length || cleanExpected.length !== OTP_CONFIG.length) {
    return false;
  }

  const hashInput = crypto.createHash('sha256').update(cleanInput).digest();
  const hashExpected = crypto.createHash('sha256').update(cleanExpected).digest();
  return crypto.timingSafeEqual(hashInput, hashExpected);
}

export function isOTPExpired(expiresAt: Date | string): boolean {
  const expiryTime =
    typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  return Date.now() > expiryTime;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(SESSION_CONFIG.tokenBytes).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiry(role: UserRole): Date {
  const ttl = role === 'customer' ? SESSION_CONFIG.customerTtlMs : SESSION_CONFIG.adminTtlMs;
  return new Date(Date.now() + ttl);
}

export function isSessionExpired(expiresAt: Date | string): boolean {
  const expiryTime =
    typeof expiresAt === 'string' ? new Date(expiresAt).getTime() : expiresAt.getTime();
  return Date.now() > expiryTime;
}
