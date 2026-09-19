import { and, desc, eq, sql } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';

import type { Coupon, CreateCouponInput, DiscountType, UpdateCouponInput } from '@hh/domain';

import { type CouponRecord, coupons, stores } from '../schema';

import type { DatabaseClient } from '../index';

function toDomainCoupon(record: CouponRecord): Coupon {
  return {
    id: record.id,
    code: record.code,
    discountType: record.discountType as DiscountType,
    value: record.value,
    minOrderValueMinor: record.minOrderValueMinor,
    maxDiscountMinor: record.maxDiscountMinor ?? null,
    usageLimit: record.usageLimit ?? null,
    timesUsed: record.timesUsed,
    startsAt: record.startsAt ? record.startsAt.toISOString() : null,
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString()
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

export async function findCouponByCode(
  db: DatabaseClient,
  storeSlug: string,
  code: string
): Promise<Coupon | null> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const normalizedCode = code.trim().toUpperCase();

  const rows = await db
    .select()
    .from(coupons)
    .where(and(eq(coupons.storeId, storeId), eq(coupons.code, normalizedCode)))
    .limit(1);

  const record = rows[0];
  return record ? toDomainCoupon(record) : null;
}

export async function listCoupons(db: DatabaseClient, storeSlug: string): Promise<Coupon[]> {
  const storeId = await getStoreIdBySlug(db, storeSlug);

  const rows = await db
    .select()
    .from(coupons)
    .where(eq(coupons.storeId, storeId))
    .orderBy(desc(coupons.createdAt));

  return rows.map(toDomainCoupon);
}

export async function createCoupon(
  db: DatabaseClient,
  storeSlug: string,
  input: CreateCouponInput
): Promise<Coupon> {
  const storeId = await getStoreIdBySlug(db, storeSlug);
  const normalizedCode = input.code.trim().toUpperCase();

  const [created] = await db
    .insert(coupons)
    .values({
      storeId,
      code: normalizedCode,
      discountType: input.discountType,
      value: input.value,
      minOrderValueMinor: input.minOrderValueMinor ?? 0,
      maxDiscountMinor: input.maxDiscountMinor ?? null,
      usageLimit: input.usageLimit ?? null,
      timesUsed: 0,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive ?? true
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create coupon record.');
  }

  return toDomainCoupon(created);
}

export async function updateCoupon(
  db: DatabaseClient,
  storeSlug: string,
  couponId: string,
  input: UpdateCouponInput
): Promise<Coupon> {
  const storeId = await getStoreIdBySlug(db, storeSlug);

  const updateValues: Partial<CouponRecord> = {
    updatedAt: new Date()
  };

  if (input.discountType !== undefined) updateValues.discountType = input.discountType;
  if (input.value !== undefined) updateValues.value = input.value;
  if (input.minOrderValueMinor !== undefined)
    updateValues.minOrderValueMinor = input.minOrderValueMinor;
  if (input.maxDiscountMinor !== undefined) updateValues.maxDiscountMinor = input.maxDiscountMinor;
  if (input.usageLimit !== undefined) updateValues.usageLimit = input.usageLimit;
  if (input.startsAt !== undefined) {
    updateValues.startsAt = input.startsAt ? new Date(input.startsAt) : null;
  }
  if (input.expiresAt !== undefined) {
    updateValues.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
  }
  if (input.isActive !== undefined) updateValues.isActive = input.isActive;

  const [updated] = await db
    .update(coupons)
    .set(updateValues)
    .where(and(eq(coupons.id, couponId), eq(coupons.storeId, storeId)))
    .returning();

  if (!updated) {
    throw new NotFoundError('Coupon', couponId);
  }

  return toDomainCoupon(updated);
}

export async function incrementCouponUsage(db: DatabaseClient, couponId: string): Promise<void> {
  await db
    .update(coupons)
    .set({
      timesUsed: sql`${coupons.timesUsed} + 1`,
      updatedAt: new Date()
    })
    .where(eq(coupons.id, couponId));
}
