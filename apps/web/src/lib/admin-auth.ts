import { cookies } from 'next/headers';

import { verifyAdminSessionToken } from '@hh/db';

import { getUserSession } from './auth';

export const ADMIN_COOKIE_NAME = 'hh_admin_session';

export function getAdminSecrets() {
  const sessionSecret =
    process.env['ADMIN_SESSION_SECRET'] ??
    'local_development_insecure_secret_key_must_be_32_chars_long';
  const password = process.env['ADMIN_PASSWORD'] ?? 'hh_admin_secret_pass_2026';
  const accessKey = process.env['ADMIN_ACCESS_KEY'] ?? 'hh_dev_access_key';

  return { sessionSecret, password, accessKey };
}

/**
 * Validates the admin session cookie from Server Components or Route Handlers.
 */
export async function getAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (sessionCookie) {
      const { sessionSecret } = getAdminSecrets();
      if (verifyAdminSessionToken(sessionCookie, sessionSecret)) return true;
    }

    // Also recognize authenticated users who hold admin or super_admin role
    const userSession = await getUserSession();
    if (
      userSession &&
      (userSession.user.role === 'admin' || userSession.user.role === 'super_admin')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Memory-based sliding-window rate limiter for admin authentication attempts.
 * Max 5 failed attempts per 15 minutes per IP.
 */
interface RateLimitRecord {
  failures: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Lock expired
  if (record.lockedUntil > 0 && record.lockedUntil <= now) {
    rateLimitStore.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordAdminAuthFailure(ip: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(ip) ?? { failures: 0, lockedUntil: 0 };
  record.failures += 1;

  if (record.failures >= 5) {
    // Lock out for 15 minutes
    record.lockedUntil = now + 15 * 60 * 1000;
  }

  rateLimitStore.set(ip, record);
}

export function resetAdminAuthFailures(ip: string): void {
  rateLimitStore.delete(ip);
}
