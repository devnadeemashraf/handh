import { NextResponse } from 'next/server';
import { createDbClient, listCoupons, createCoupon } from '@hh/db';
import { CreateCouponSchema } from '@hh/domain';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function GET() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const coupons = await listCoupons(db, 'hh');

    return NextResponse.json({ success: true, coupons });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch coupons.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
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

    const db = getDatabase();
    const coupon = await createCoupon(db, 'hh', parseResult.data);

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
