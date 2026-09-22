import { cookies } from 'next/headers';

import { findSessionByTokenHash, getSharedDbClient, hashSessionToken } from '@hh/db';
import { hasPermission } from '@hh/domain';

import type { UserSessionRecord } from '@hh/db';
import type { Permission, User } from '@hh/domain';

export const USER_SESSION_COOKIE = 'hh_session';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function getUserSession(): Promise<{ user: User; session: UserSessionRecord } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_SESSION_COOKIE)?.value;
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const db = getDatabase();
    return await findSessionByTokenHash(db, tokenHash);
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const result = await getUserSession();
  return result ? result.user : null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<User> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: missing permission '${permission}'`);
  }
  return user;
}
