import { NextResponse } from 'next/server';

import { exportUserData, getSharedDbClient } from '@hh/db';

import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

/**
 * DPDP Act 2023 §12 Data Portability Export Endpoint.
 * Authenticated customer requests a structured machine-readable JSON archive of all personal data.
 */
export async function GET() {
  try {
    const user = await requireUser();
    const db = getDatabase();
    const dataExport = await exportUserData(db, user.id);

    return new NextResponse(JSON.stringify(dataExport, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="hh-user-data-export-${user.id}.json"`,
        'Cache-Control': 'no-store, private'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication required';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
