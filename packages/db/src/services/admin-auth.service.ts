import crypto from 'node:crypto';

import type { AdminRole, AdminUser } from '@hh/domain';

import { recordAdminAuditLog } from '../repositories/admin-audit.repository';
import { createAdminSession } from '../repositories/admin-session.repository';
import {
  countAdminUsers,
  createAdminUser,
  findAdminUserByEmail,
  recordAdminFailedAttempt,
  toDomainAdminUser,
  updateAdminLastLogin
} from '../repositories/admin-user.repository';
import { type AdminUserRecord } from '../schema/admin';

import type { DatabaseClient } from '../index';

function scryptAsync(
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

// Dummy hash used for constant-time comparison when an email is not found
const DUMMY_SCRYPT_HASH =
  'scrypt$N=16384,r=8,p=1$0000000000000000000000000000000000000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

/**
 * Compares two strings in constant time to prevent timing side-channel attacks.
 * Hashes both strings with SHA-256 first so length differences don't leak information.
 */
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Legacy password verification for backward compatibility.
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

/**
 * Hashes a plaintext password using Node.js native crypto.scrypt with a 32-byte cryptographically secure salt.
 * Produces format: scrypt$N=16384,r=8,p=1$<salt_hex>$<derived_key_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(32).toString('hex');
  const N = 16384;
  const r = 8;
  const p = 1;
  const keylen = 64;

  const derivedKey = (await scryptAsync(password, salt, keylen, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024
  })) as Buffer;

  return `scrypt$N=${N},r=${r},p=${p}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash in constant time.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (!password || !storedHash) return false;

    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt') {
      return false;
    }

    const paramsStr = parts[1];
    const salt = parts[2];
    const hashHex = parts[3];

    if (!paramsStr || !salt || !hashHex) return false;

    // Parse parameters
    const params = new URLSearchParams(paramsStr.replace(/,/g, '&'));
    const N = Number.parseInt(params.get('N') ?? '16384', 10);
    const r = Number.parseInt(params.get('r') ?? '8', 10);
    const p = Number.parseInt(params.get('p') ?? '1', 10);
    const keylen = Buffer.from(hashHex, 'hex').length;

    const derivedKey = (await scryptAsync(password, salt, keylen, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024
    })) as Buffer;

    const expectedKey = Buffer.from(hashHex, 'hex');
    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

/**
 * Generates a high-entropy random session token and its SHA-256 hash.
 */
export function generateAdminSessionToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashAdminSessionToken(rawToken);
  return { rawToken, tokenHash };
}

/**
 * Hashes an admin session token with SHA-256 for secure database storage.
 */
export function hashAdminSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export interface AuthenticateAdminInput {
  email: string;
  password: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  maxAttempts?: number | undefined;
  lockoutDurationMs?: number | undefined;
}

export type AuthenticateAdminResult =
  | {
      success: true;
      admin: AdminUser;
      sessionToken: string;
      expiresAt: Date;
    }
  | {
      success: false;
      error: string;
      isLocked?: boolean | undefined;
      retryAfterSeconds?: number | undefined;
    };

/**
 * Enterprise Admin Password Authentication.
 * Handles timing attacks, constant-time responses, brute-force lockout, session generation, and audit logging.
 */
export async function authenticateAdminWithPassword(
  db: DatabaseClient,
  input: AuthenticateAdminInput
): Promise<AuthenticateAdminResult> {
  const {
    email,
    password,
    ipAddress,
    userAgent,
    maxAttempts = 5,
    lockoutDurationMs = 15 * 60 * 1000
  } = input;

  const normalizedEmail = email.trim().toLowerCase();
  const admin = await findAdminUserByEmail(db, normalizedEmail);

  // 1. Defend against User Enumeration via Constant-Time Dummy Verification
  if (!admin) {
    // Perform dummy scrypt computation to match execution timing
    await verifyPassword(password, DUMMY_SCRYPT_HASH);

    await recordAdminAuditLog(db, {
      adminId: null,
      adminEmail: normalizedEmail,
      action: 'admin:login_failed',
      entityType: 'admin_user',
      entityId: null,
      details: { reason: 'user_not_found' },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    });

    return { success: false, error: 'Invalid email or password.' };
  }

  const now = new Date();

  // 2. Check Account Lockout
  if (admin.lockedUntil && admin.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((admin.lockedUntil.getTime() - now.getTime()) / 1000);

    await recordAdminAuditLog(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'admin:login_blocked_locked',
      entityType: 'admin_user',
      entityId: admin.id,
      details: { reason: 'account_locked', retryAfterSeconds },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    });

    return {
      success: false,
      error: `Account is temporarily locked. Please try again in ${retryAfterSeconds} seconds.`,
      isLocked: true,
      retryAfterSeconds
    };
  }

  // 3. Check Account Status
  if (!admin.isActive) {
    await recordAdminAuditLog(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'admin:login_failed_deactivated',
      entityType: 'admin_user',
      entityId: admin.id,
      details: { reason: 'account_deactivated' },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    });

    return { success: false, error: 'Account is deactivated. Please contact an administrator.' };
  }

  // 4. Check Password Configuration
  if (!admin.passwordHash) {
    return {
      success: false,
      error: 'Password authentication not configured for this account. Please sign in with SSO.'
    };
  }

  // 5. Verify Password
  const isValid = await verifyPassword(password, admin.passwordHash);

  if (!isValid) {
    const lockout = await recordAdminFailedAttempt(db, admin.id, maxAttempts, lockoutDurationMs);

    if (lockout.isLocked && lockout.lockedUntil) {
      const retryAfterSeconds = Math.ceil((lockout.lockedUntil.getTime() - now.getTime()) / 1000);

      await recordAdminAuditLog(db, {
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'admin:account_locked',
        entityType: 'admin_user',
        entityId: admin.id,
        details: { attempts: lockout.attempts, retryAfterSeconds },
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null
      });

      return {
        success: false,
        error: `Account is temporarily locked due to too many failed attempts. Try again in ${retryAfterSeconds} seconds.`,
        isLocked: true,
        retryAfterSeconds
      };
    }

    await recordAdminAuditLog(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'admin:login_failed',
      entityType: 'admin_user',
      entityId: admin.id,
      details: { attempts: lockout.attempts },
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null
    });

    return { success: false, error: 'Invalid email or password.' };
  }

  // 6. Login Success: Reset failures, update last login, issue session
  await updateAdminLastLogin(db, admin.id);

  const { rawToken, tokenHash } = generateAdminSessionToken();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

  await createAdminSession(db, admin.id, tokenHash, expiresAt, ipAddress, userAgent, 5);

  await recordAdminAuditLog(db, {
    adminId: admin.id,
    adminEmail: admin.email,
    action: 'admin:login_success',
    entityType: 'admin_user',
    entityId: admin.id,
    details: { loginMethod: 'password' },
    ipAddress: ipAddress ?? null,
    userAgent: userAgent ?? null
  });

  return {
    success: true,
    admin: toDomainAdminUser(admin),
    sessionToken: rawToken,
    expiresAt
  };
}

/**
 * Seeds initial Super Admin into `admin_users` table if the table is empty.
 * Reads environment variables or applies secure defaults for development.
 */
export async function bootstrapInitialAdmin(
  db: DatabaseClient,
  storeId: string
): Promise<AdminUserRecord | null> {
  const count = await countAdminUsers(db);
  if (count > 0) {
    return null; // Already provisioned
  }

  const initialEmail = process.env['INITIAL_ADMIN_EMAIL'] ?? 'admin@handh.in';
  const initialPassword = process.env['INITIAL_ADMIN_PASSWORD'] ?? 'hh_admin_master_password_2026';
  const initialRole: AdminRole = (process.env['INITIAL_ADMIN_ROLE'] as AdminRole) ?? 'super_admin';

  const passwordHash = await hashPassword(initialPassword);

  const created = await createAdminUser(db, {
    storeId,
    email: initialEmail,
    name: 'Primary Super Administrator',
    passwordHash,
    role: initialRole,
    isActive: true,
    failedLoginAttempts: 0
  });

  await recordAdminAuditLog(db, {
    adminId: created.id,
    adminEmail: created.email,
    action: 'admin:bootstrap_initial_super_admin',
    entityType: 'admin_user',
    entityId: created.id,
    details: { email: initialEmail, role: initialRole },
    ipAddress: '127.0.0.1',
    userAgent: 'system_bootstrap'
  });

  return created;
}

// Re-export token utilities for backward compatibility
export interface AdminSessionPayload {
  role: 'admin';
  createdAt: number;
  expiresAt: number;
  nonce: string;
}

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

export function verifyAdminSessionToken(token: string, secret: string): boolean {
  try {
    if (!token || !secret) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [payloadEncoded, signature] = parts;
    if (!payloadEncoded || !signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest('base64url');

    if (!timingSafeStringEqual(signature, expectedSignature)) {
      return false;
    }

    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as Partial<AdminSessionPayload>;

    if (payload.role !== 'admin' || typeof payload.expiresAt !== 'number') {
      return false;
    }

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
