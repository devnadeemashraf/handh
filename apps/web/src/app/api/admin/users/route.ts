import { NextResponse } from 'next/server';

import { getSharedDbClient, listUsers } from '@hh/db';

import { getAdminSession } from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  try {
    const isAuthed = await getAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    const users = await listUsers(db, 'hh');

    return NextResponse.json({ success: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve users.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
