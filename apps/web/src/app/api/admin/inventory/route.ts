import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

import { getSharedDbClient, listAdminInventory, listInventoryAuditLogs } from '@hh/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const [inventoryData, auditLogs] = await Promise.all([
      listAdminInventory(db),
      listInventoryAuditLogs(db, undefined, 50)
    ]);

    return NextResponse.json({
      success: true,
      items: inventoryData.items,
      summary: inventoryData.summary,
      auditLogs
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch inventory roster.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
