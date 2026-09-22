import { NextResponse } from 'next/server';

import { recordAdminAuditLog, transitionOrderStatus } from '@hh/db';

import type { OrderStatus } from '@hh/domain';

import { getAdminSession, getSharedDb } from '../../../../../../lib/admin-auth';
import { getClientIp } from '../../../../../../lib/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const { status } = json ?? {};

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Target status is required.' },
        { status: 400 }
      );
    }

    const db = getSharedDb();
    const updatedOrder = await transitionOrderStatus(db, params.id, status as OrderStatus);

    // Audit logging for state transitions (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'order:status_updated',
      entityType: 'order',
      entityId: params.id,
      details: { newStatus: status },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order status.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
