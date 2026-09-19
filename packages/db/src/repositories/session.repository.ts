import { and, eq, gt, lt } from 'drizzle-orm';

import type { User } from '@hh/domain';

import { users, type UserSessionRecord, userSessions } from '../schema';
import { toDomainUser } from './user.repository';

import type { DatabaseClient } from '../index';

export async function createSession(
  db: DatabaseClient,
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  ipAddress?: string | undefined,
  userAgent?: string | undefined
): Promise<UserSessionRecord> {
  const [created] = await db
    .insert(userSessions)
    .values({
      userId,
      tokenHash,
      expiresAt,
      ...(ipAddress !== undefined ? { ipAddress } : {}),
      ...(userAgent !== undefined ? { userAgent } : {})
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create user session record.');
  }

  return created;
}

export async function findSessionByTokenHash(
  db: DatabaseClient,
  tokenHash: string
): Promise<{ session: UserSessionRecord; user: User } | null> {
  const now = new Date();
  const rows = await db
    .select({
      session: userSessions,
      user: users
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(and(eq(userSessions.tokenHash, tokenHash), gt(userSessions.expiresAt, now)))
    .limit(1);

  const match = rows[0];
  if (!match) return null;

  return {
    session: match.session,
    user: toDomainUser(match.user)
  };
}

export async function revokeSession(db: DatabaseClient, sessionId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function revokeSessionByTokenHash(
  db: DatabaseClient,
  tokenHash: string
): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
}

export async function revokeAllUserSessions(db: DatabaseClient, userId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

export async function cleanExpiredSessions(db: DatabaseClient): Promise<number> {
  const now = new Date();
  const deleted = await db
    .delete(userSessions)
    .where(lt(userSessions.expiresAt, now))
    .returning({ id: userSessions.id });

  return deleted.length;
}
