import { NextResponse } from 'next/server';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/client-ip';

import { adjustStock, recordAdminAuditLog } from '@hh/db';
import { StockAdjustmentSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = StockAdjustmentSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed.',
          details: parseResult.error.format()
        },
        { status: 400 }
      );
    }

    const db = getSharedDb();
    const result = await adjustStock(db, parseResult.data);

    // Record immutable audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'inventory:stock_adjusted',
      entityType: 'inventory_level',
      entityId: parseResult.data.variantId,
      details: { delta: parseResult.data.delta, reason: parseResult.data.reason },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      level: result.level,
      auditLog: result.auditLog
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to adjust stock.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
