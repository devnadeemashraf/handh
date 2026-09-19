import { and, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';

import type { UpdateProfileInput, User, UserRole } from '@hh/domain';

import { stores, type UserRecord, users } from '../schema';

import type { DatabaseClient } from '../index';

export function toDomainUser(record: UserRecord): User {
  return {
    id: record.id,
    storeId: record.storeId,
    phone: record.phone,
    phoneVerified: record.phoneVerified,
    email: record.email,
    emailVerified: record.emailVerified,
    name: record.name,
    avatarUrl: record.avatarUrl,
    role: record.role as UserRole,
    whatsappOptIn: record.whatsappOptIn,
    lastLoginAt: record.lastLoginAt ? record.lastLoginAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

async function getStoreIdBySlug(db: DatabaseClient, storeSlug: string): Promise<string> {
  const storeRows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.slug, storeSlug))
    .limit(1);

  const store = storeRows[0];
  if (!store) {
    throw new NotFoundError('Store', storeSlug);
  }

  return store.id;
}

export async function findUserById(db: DatabaseClient, userId: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function findUserByPhone(
  db: DatabaseClient,
  storeSlug: string,
  phone: string
): Promise<User | null> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.storeId, storeId), eq(users.phone, phone)))
    .limit(1);

  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function findUserByEmail(
  db: DatabaseClient,
  storeSlug: string,
  email: string
): Promise<User | null> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const normalizedEmail = email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.storeId, storeId), eq(users.email, normalizedEmail)))
    .limit(1);

  const record = rows[0];
  return record ? toDomainUser(record) : null;
}

export async function createUser(
  db: DatabaseClient,
  storeSlug: string,
  input: {
    phone: string;
    name?: string | undefined;
    email?: string | undefined;
    role?: UserRole | undefined;
    whatsappOptIn?: boolean | undefined;
    phoneVerified?: boolean | undefined;
  }
): Promise<User> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const [created] = await db
    .insert(users)
    .values({
      storeId,
      phone: input.phone,
      phoneVerified: input.phoneVerified ?? false,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email.trim().toLowerCase() } : {}),
      ...(input.role !== undefined ? { role: input.role } : { role: 'customer' }),
      ...(input.whatsappOptIn !== undefined ? { whatsappOptIn: input.whatsappOptIn } : {})
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create user record.');
  }

  return toDomainUser(created);
}

export async function updateUserProfile(
  db: DatabaseClient,
  userId: string,
  input: UpdateProfileInput
): Promise<User> {
  const updateValues: Partial<UserRecord> = {
    updatedAt: new Date()
  };

  if (input.name !== undefined) updateValues.name = input.name;
  if (input.email !== undefined) updateValues.email = input.email.trim().toLowerCase();
  if (input.whatsappOptIn !== undefined) updateValues.whatsappOptIn = input.whatsappOptIn;

  const [updated] = await db
    .update(users)
    .set(updateValues)
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError('User', userId);
  }

  return toDomainUser(updated);
}

export async function updateUserLastLogin(db: DatabaseClient, userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}

export async function listUsers(db: DatabaseClient, storeSlug: string): Promise<User[]> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.storeId, storeId))
    .orderBy(desc(users.createdAt));

  return rows.map(toDomainUser);
}

export async function updateUserRole(
  db: DatabaseClient,
  userId: string,
  role: UserRole
): Promise<User> {
  const [updated] = await db
    .update(users)
    .set({
      role,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new NotFoundError('User', userId);
  }

  return toDomainUser(updated);
}
