import { and, count, desc, eq, gt, gte, isNull, lt, sql } from 'drizzle-orm';

import { OTP_CONFIG, type OTPPurpose } from '@hh/domain';

import { type OTPCodeRecord, otpCodes } from '../schema';

import type { DatabaseClient } from '../index';

export async function createOTP(
  db: DatabaseClient,
  phone: string,
  code: string,
  purpose: OTPPurpose = 'login',
  expiresAt?: Date | undefined
): Promise<OTPCodeRecord> {
  const expiry = expiresAt ?? new Date(Date.now() + OTP_CONFIG.ttlMs);

  const [record] = await db
    .insert(otpCodes)
    .values({
      phone,
      code,
      purpose,
      expiresAt: expiry,
      attempts: 0
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create OTP record.');
  }

  return record;
}

export async function findValidOTP(
  db: DatabaseClient,
  phone: string,
  purpose: OTPPurpose = 'login'
): Promise<OTPCodeRecord | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        eq(otpCodes.purpose, purpose),
        isNull(otpCodes.verifiedAt),
        gt(otpCodes.expiresAt, now),
        lt(otpCodes.attempts, OTP_CONFIG.maxAttempts)
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  return rows[0] ?? null;
}

export async function incrementOTPAttempts(db: DatabaseClient, otpId: string): Promise<void> {
  await db
    .update(otpCodes)
    .set({
      attempts: sql`${otpCodes.attempts} + 1`
    })
    .where(eq(otpCodes.id, otpId));
}

export async function markOTPVerified(db: DatabaseClient, otpId: string): Promise<void> {
  await db
    .update(otpCodes)
    .set({
      verifiedAt: new Date()
    })
    .where(eq(otpCodes.id, otpId));
}

export async function countRecentOTPs(
  db: DatabaseClient,
  phone: string,
  windowMs: number = 15 * 60 * 1000
): Promise<number> {
  const threshold = new Date(Date.now() - windowMs);
  const rows = await db
    .select({ total: count() })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gte(otpCodes.createdAt, threshold)));

  return rows[0]?.total ?? 0;
}
