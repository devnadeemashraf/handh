import { NextResponse } from 'next/server';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/client-ip';

import { recordAdminAuditLog, sweepExpiredReservations } from '@hh/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Administrative endpoint to trigger on-demand inventory reservation vacuum (E-COM-043, E-COM-117).
 * Atomically releases expired holds, restores reserved inventory, and cancels stale abandoned orders.
 */
export async function POST(request: Request) {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getSharedDb();
    const result = await sweepExpiredReservations(db);

    // Record immutable audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'inventory:reservations_swept',
      entityType: 'inventory_reservation',
      entityId: sessionContext.admin.id,
      details: {
        releasedReservationsCount: result.releasedReservationsCount,
        affectedVariantsCount: result.affectedVariantsCount,
        cancelledOrdersCount: result.cancelledOrdersCount,
        orderIds: result.orderIds
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      releasedReservationsCount: result.releasedReservationsCount,
      affectedVariantsCount: result.affectedVariantsCount,
      cancelledOrdersCount: result.cancelledOrdersCount,
      orderIds: result.orderIds
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to sweep inventory reservations.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
