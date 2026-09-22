import { and, asc, eq, gt, lt } from 'drizzle-orm';

import type { AdminUser } from '@hh/domain';

import { type AdminSessionRecord, adminSessions, adminUsers } from '../schema/admin';
import { toDomainAdminUser } from './admin-user.repository';

import type { DatabaseClient } from '../index';

export async function createAdminSession(
  db: DatabaseClient,
  adminId: string,
  tokenHash: string,
  expiresAt: Date,
  ipAddress?: string | undefined,
  userAgent?: string | undefined,
  maxConcurrentSessions = 5
): Promise<AdminSessionRecord> {
  const now = new Date();

  // 1. Clean up any expired sessions for this admin
  await db
    .delete(adminSessions)
    .where(and(eq(adminSessions.adminId, adminId), lt(adminSessions.expiresAt, now)));

  // 2. Enforce concurrent session limit (e.g. max 5 concurrent sessions)
  const existingActiveSessions = await db
    .select({ id: adminSessions.id })
    .from(adminSessions)
    .where(and(eq(adminSessions.adminId, adminId), gt(adminSessions.expiresAt, now)))
    .orderBy(asc(adminSessions.createdAt));

  if (existingActiveSessions.length >= maxConcurrentSessions) {
    const sessionsToRevokeCount = existingActiveSessions.length - maxConcurrentSessions + 1;
    const oldestSessionIds = existingActiveSessions
      .slice(0, sessionsToRevokeCount)
      .map((s) => s.id);

    for (const id of oldestSessionIds) {
      await db.delete(adminSessions).where(eq(adminSessions.id, id));
    }
  }

  // 3. Insert new session
  const [created] = await db
    .insert(adminSessions)
    .values({
      adminId,
      tokenHash,
      expiresAt,
      ...(ipAddress !== undefined ? { ipAddress } : {}),
      ...(userAgent !== undefined ? { userAgent } : {})
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create admin session record.');
  }

  return created;
}

export async function findAdminSessionByTokenHash(
  db: DatabaseClient,
  tokenHash: string
): Promise<{ session: AdminSessionRecord; admin: AdminUser } | null> {
  const now = new Date();
  const rows = await db
    .select({
      session: adminSessions,
      admin: adminUsers
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.tokenHash, tokenHash),
        gt(adminSessions.expiresAt, now),
        eq(adminUsers.isActive, true)
      )
    )
    .limit(1);

  const match = rows[0];
  if (!match) return null;

  // Verify account is not locked out
  if (match.admin.lockedUntil && match.admin.lockedUntil > now) {
    return null;
  }

  return {
    session: match.session,
    admin: toDomainAdminUser(match.admin)
  };
}

export async function revokeAdminSession(db: DatabaseClient, tokenHash: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, tokenHash));
}

export async function revokeAllAdminSessions(db: DatabaseClient, adminId: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.adminId, adminId));
}

export async function cleanExpiredAdminSessions(db: DatabaseClient): Promise<number> {
  const now = new Date();
  const deleted = await db
    .delete(adminSessions)
    .where(lt(adminSessions.expiresAt, now))
    .returning({ id: adminSessions.id });

  return deleted.length;
}
