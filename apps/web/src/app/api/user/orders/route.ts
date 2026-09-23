import { NextResponse } from 'next/server';

import { getSharedDbClient, listOrdersByUserId } from '@hh/db';

import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDatabase();
    const orders = await listOrdersByUserId(db, user.id);

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order history.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
