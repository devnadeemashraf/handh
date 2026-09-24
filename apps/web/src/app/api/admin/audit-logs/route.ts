import { NextResponse } from 'next/server';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';

import { countAdminAuditLogs, listAdminAuditLogs } from '@hh/db';
import { AdminAuditLogFilterSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      adminId: searchParams.get('adminId') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined
    };

    const parsed = AdminAuditLogFilterSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { adminId, action, entityType, limit, offset } = parsed.data;
    const db = getSharedDb();

    const [logs, total] = await Promise.all([
      listAdminAuditLogs(db, { adminId, action, entityType, limit, offset }),
      countAdminAuditLogs(db, { adminId, action, entityType })
    ]);

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query audit logs.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
