import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

import { getSharedDbClient, updateCoupon } from '@hh/db';
import { UpdateCouponSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await props.params;

  try {
    const json = await request.json();
    const parseResult = UpdateCouponSchema.safeParse(json);

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
    const updated = await updateCoupon(db, 'hh', id, parseResult.data);

    return NextResponse.json({
      success: true,
      message: 'Coupon updated successfully.',
      coupon: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update coupon.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
