import { and, desc, eq } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';

import type { CreateFamilyMemberInput, FamilyMember, UpdateFamilyMemberInput } from '@hh/domain';

import { type FamilyMemberRecord, familyMembers } from '../schema';

import type { DatabaseClient } from '../index';

export function toDomainFamilyMember(record: FamilyMemberRecord): FamilyMember {
  return {
    id: record.id,
    userId: record.userId,
    name: record.name,
    relationship: record.relationship,
    preferences: record.preferences,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function listFamilyMembers(
  db: DatabaseClient,
  userId: string
): Promise<FamilyMember[]> {
  const rows = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.userId, userId))
    .orderBy(desc(familyMembers.createdAt));

  return rows.map(toDomainFamilyMember);
}

export async function findFamilyMemberById(
  db: DatabaseClient,
  userId: string,
  memberId: string
): Promise<FamilyMember | null> {
  const rows = await db
    .select()
    .from(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
    .limit(1);

  const match = rows[0];
  return match ? toDomainFamilyMember(match) : null;
}

export async function createFamilyMember(
  db: DatabaseClient,
  userId: string,
  input: CreateFamilyMemberInput
): Promise<FamilyMember> {
  const [created] = await db
    .insert(familyMembers)
    .values({
      userId,
      name: input.name,
      ...(input.relationship !== undefined ? { relationship: input.relationship } : {}),
      preferences: input.preferences ?? {}
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create family member record.');
  }

  return toDomainFamilyMember(created);
}

export async function updateFamilyMember(
  db: DatabaseClient,
  userId: string,
  memberId: string,
  input: UpdateFamilyMemberInput
): Promise<FamilyMember> {
  const updateValues: Partial<FamilyMemberRecord> = {
    updatedAt: new Date()
  };

  if (input.name !== undefined) updateValues.name = input.name;
  if (input.relationship !== undefined) updateValues.relationship = input.relationship;
  if (input.preferences !== undefined) updateValues.preferences = input.preferences;

  const [updated] = await db
    .update(familyMembers)
    .set(updateValues)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
    .returning();

  if (!updated) {
    throw new NotFoundError('FamilyMember', memberId);
  }

  return toDomainFamilyMember(updated);
}

export async function deleteFamilyMember(
  db: DatabaseClient,
  userId: string,
  memberId: string
): Promise<void> {
  const result = await db
    .delete(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
    .returning({ id: familyMembers.id });

  if (result.length === 0) {
    throw new NotFoundError('FamilyMember', memberId);
  }
}
