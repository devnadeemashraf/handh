import { NextResponse } from 'next/server';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/client-ip';

import { createCoupon, listCoupons, recordAdminAuditLog } from '@hh/db';
import { CreateCouponSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getSharedDb();
    const coupons = await listCoupons(db, 'hh');

    return NextResponse.json({ success: true, coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch coupons.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = CreateCouponSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.format()
        },
        { status: 400 }
      );
    }

    const db = getSharedDb();
    const coupon = await createCoupon(db, 'hh', parseResult.data);

    // Record immutable audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'coupon:created',
      entityType: 'coupon',
      entityId: coupon.id,
      details: {
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      message: 'Promotional coupon created successfully.',
      coupon
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
