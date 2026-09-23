import { NextResponse } from 'next/server';

import { findCouponByCode, getSharedDbClient } from '@hh/db';
import { validateCoupon } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

function parseValidateCouponRequest(
  json: unknown
): { ok: true; code: string; subtotalMinor: number } | { ok: false } {
  if (typeof json !== 'object' || json === null) return { ok: false };
  const obj = json as Record<string, unknown>;
  if (typeof obj['code'] !== 'string' || obj['code'].length === 0) return { ok: false };
  if (
    typeof obj['subtotalMinor'] !== 'number' ||
    !Number.isInteger(obj['subtotalMinor']) ||
    obj['subtotalMinor'] < 0
  )
    return { ok: false };
  return { ok: true, code: obj['code'], subtotalMinor: obj['subtotalMinor'] };
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = parseValidateCouponRequest(json);

    if (!parseResult.ok) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          reason: 'Invalid coupon verification request parameters.'
        },
        { status: 400 }
      );
    }

    const { code, subtotalMinor } = parseResult;
    const db = getDatabase();

    const coupon = await findCouponByCode(db, 'hh', code);
    const validation = validateCoupon(coupon, { subtotalMinor });

    if (!validation.valid) {
      return NextResponse.json({
        success: true,
        valid: false,
        reason: validation.reason
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        discountType: validation.coupon.discountType,
        value: validation.coupon.value
      },
      discountMinor: validation.discountMinor,
      newSubtotalMinor: validation.newSubtotalMinor
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Coupon validation failed.';
    return NextResponse.json(
      {
        success: false,
        valid: false,
        reason: message
      },
      { status: 500 }
    );
  }
}
