import { cookies } from 'next/headers';

import {
  type AdminSessionRecord,
  findAdminSessionByTokenHash,
  getSharedDbClient,
  hashAdminSessionToken
} from '@hh/db';

import type { AdminRole, AdminUser } from '@hh/domain';

import { adminLoginRateLimiter } from './rate-limit';

export const ADMIN_COOKIE_NAME = 'hh_admin_session';

export interface AdminSessionContext {
  admin: AdminUser;
  session: AdminSessionRecord;
}

export function getSharedDb() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

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
 * Queries admin_sessions joined with admin_users.
 * Customer sessions (hh_session) can NEVER satisfy this check (E-COM-015).
 */
export async function getAdminSession(): Promise<AdminSessionContext | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenHash = hashAdminSessionToken(token);
    const db = getSharedDb();
    const result = await findAdminSessionByTokenHash(db, tokenHash);
    if (!result) return null;

    return result;
  } catch {
    return null;
  }
}

/**
 * Asserts admin authentication and optional role-level authorization.
 */
export async function requireAdmin(requiredRole?: AdminRole): Promise<AdminSessionContext> {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    throw new Error('Unauthorized: Admin authentication required.');
  }

  if (requiredRole === 'super_admin' && sessionContext.admin.role !== 'super_admin') {
    throw new Error('Forbidden: Super Administrator privileges required.');
  }

  return sessionContext;
}

/**
 * Redis sliding-window rate limit checker for admin login attempts (E-COM-017).
 */
export async function checkAdminLoginRateLimit(
  ip: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const result = await adminLoginRateLimiter.limit(ip);
  if (!result.success) {
    const retryAfterSeconds = Math.max(1, result.reset - Math.floor(Date.now() / 1000));
    return { allowed: false, retryAfterSeconds };
  }
  return { allowed: true };
}
