import { and, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';

import type { CreateAddressInput, UpdateAddressInput, UserAddress } from '@hh/domain';

import { userAddresses, type UserAddressRecord } from '../schema';

import type { DatabaseClient } from '../index';

export function toDomainAddress(record: UserAddressRecord): UserAddress {
  return {
    id: record.id,
    userId: record.userId,
    label: record.label,
    recipientName: record.recipientName,
    phone: record.phone,
    line1: record.line1,
    line2: record.line2,
    city: record.city,
    state: record.state,
    postalCode: record.postalCode,
    country: record.country,
    isDefault: record.isDefault,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listAddresses(db: DatabaseClient, userId: string): Promise<UserAddress[]> {
  const rows = await db
    .select()
    .from(userAddresses)
    .where(eq(userAddresses.userId, userId))
    .orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));

  return rows.map(toDomainAddress);
}

export async function findAddressById(
  db: DatabaseClient,
  userId: string,
  addressId: string
): Promise<UserAddress | null> {
  const rows = await db
    .select()
    .from(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .limit(1);

  const match = rows[0];
  return match ? toDomainAddress(match) : null;
}

export async function createAddress(
  db: DatabaseClient,
  userId: string,
  input: CreateAddressInput
): Promise<UserAddress> {
  if (input.isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(userAddresses.userId, userId));
  }

  const [created] = await db
    .insert(userAddresses)
    .values({
      userId,
      label: input.label,
      recipientName: input.recipientName,
      phone: input.phone,
      line1: input.line1,
      ...(input.line2 !== undefined ? { line2: input.line2 } : {}),
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country ?? 'IN',
      isDefault: input.isDefault ?? false
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create address record.');
  }

  return toDomainAddress(created);
}

export async function updateAddress(
  db: DatabaseClient,
  userId: string,
  addressId: string,
  input: UpdateAddressInput
): Promise<UserAddress> {
  if (input.isDefault) {
    await db
      .update(userAddresses)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(userAddresses.userId, userId));
  }

  const updateValues: Partial<UserAddressRecord> = {
    updatedAt: new Date()
  };

  if (input.label !== undefined) updateValues.label = input.label;
  if (input.recipientName !== undefined) updateValues.recipientName = input.recipientName;
  if (input.phone !== undefined) updateValues.phone = input.phone;
  if (input.line1 !== undefined) updateValues.line1 = input.line1;
  if (input.line2 !== undefined) updateValues.line2 = input.line2;
  if (input.city !== undefined) updateValues.city = input.city;
  if (input.state !== undefined) updateValues.state = input.state;
  if (input.postalCode !== undefined) updateValues.postalCode = input.postalCode;
  if (input.country !== undefined) updateValues.country = input.country;
  if (input.isDefault !== undefined) updateValues.isDefault = input.isDefault;

  const [updated] = await db
    .update(userAddresses)
    .set(updateValues)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .returning();

  if (!updated) {
    throw new NotFoundError('Address', addressId);
  }

  return toDomainAddress(updated);
}

export async function deleteAddress(
  db: DatabaseClient,
  userId: string,
  addressId: string
): Promise<void> {
  const result = await db
    .delete(userAddresses)
    .where(and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)))
    .returning({ id: userAddresses.id });

  if (result.length === 0) {
    throw new NotFoundError('Address', addressId);
  }
}

export async function setDefaultAddress(
  db: DatabaseClient,
  userId: string,
  addressId: string
): Promise<UserAddress> {
  return updateAddress(db, userId, addressId, { isDefault: true });
}
