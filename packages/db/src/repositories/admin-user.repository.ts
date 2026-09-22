import { count, eq } from 'drizzle-orm';

import type { AdminUser } from '@hh/domain';

import { type AdminUserRecord, adminUsers, type NewAdminUserRecord } from '../schema/admin';

import type { DatabaseClient } from '../index';

export function toDomainAdminUser(record: AdminUserRecord): AdminUser {
  return {
    id: record.id,
    storeId: record.storeId,
    email: record.email,
    name: record.name,
    role: record.role,
    isActive: record.isActive,
    failedLoginAttempts: record.failedLoginAttempts,
    lockedUntil: record.lockedUntil?.toISOString() ?? null,
    lastLoginAt: record.lastLoginAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function findAdminUserByEmail(
  db: DatabaseClient,
  email: string
): Promise<AdminUserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  return user ?? null;
}

export async function findAdminUserById(
  db: DatabaseClient,
  id: string
): Promise<AdminUserRecord | null> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  return user ?? null;
}

export async function createAdminUser(
  db: DatabaseClient,
  data: Omit<NewAdminUserRecord, 'email'> & { email: string }
): Promise<AdminUserRecord> {
  const [created] = await db
    .insert(adminUsers)
    .values({
      ...data,
      email: data.email.trim().toLowerCase()
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create admin user.');
  }

  return created;
}

export async function updateAdminUser(
  db: DatabaseClient,
  id: string,
  data: Partial<Omit<NewAdminUserRecord, 'id' | 'createdAt'>>
): Promise<AdminUserRecord> {
  const [updated] = await db
    .update(adminUsers)
    .set({
      ...data,
      updatedAt: new Date()
    })
    .where(eq(adminUsers.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Admin user with ID ${id} not found.`);
  }

  return updated;
}

export async function recordAdminFailedAttempt(
  db: DatabaseClient,
  id: string,
  maxAttempts = 5,
  lockoutDurationMs = 15 * 60 * 1000
): Promise<{ isLocked: boolean; lockedUntil: Date | null; attempts: number }> {
  const admin = await findAdminUserById(db, id);
  if (!admin) {
    return { isLocked: false, lockedUntil: null, attempts: 0 };
  }

  const newAttempts = admin.failedLoginAttempts + 1;
  const now = new Date();
  let lockedUntil: Date | null = null;

  if (newAttempts >= maxAttempts) {
    lockedUntil = new Date(now.getTime() + lockoutDurationMs);
  }

  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: newAttempts,
      lockedUntil,
      updatedAt: now
    })
    .where(eq(adminUsers.id, id));

  return {
    isLocked: lockedUntil !== null,
    lockedUntil,
    attempts: newAttempts
  };
}

export async function resetAdminFailedAttempts(db: DatabaseClient, id: string): Promise<void> {
  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date()
    })
    .where(eq(adminUsers.id, id));
}

export async function updateAdminLastLogin(db: DatabaseClient, id: string): Promise<void> {
  const now = new Date();
  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
      updatedAt: now
    })
    .where(eq(adminUsers.id, id));
}

export async function listAdminUsers(db: DatabaseClient, storeId: string): Promise<AdminUser[]> {
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.storeId, storeId))
    .orderBy(adminUsers.createdAt);

  return rows.map(toDomainAdminUser);
}

export async function countAdminUsers(db: DatabaseClient): Promise<number> {
  const [result] = await db.select({ total: count() }).from(adminUsers);
  return Number(result?.total ?? 0);
}
