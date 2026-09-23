import { NextResponse } from 'next/server';

import { getSharedDbClient, getStoreServiceControl } from '@hh/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  try {
    const db = getDatabase();
    const serviceControl = await getStoreServiceControl(db, 'hh');

    return NextResponse.json({
      success: true,
      serviceControl
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query service status.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
