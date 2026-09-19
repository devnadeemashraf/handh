import { NextResponse } from 'next/server';
import { createDbClient, transitionOrderStatus } from '@hh/db';
import { getAdminSession } from '../../../../../../lib/admin-auth';
import type { OrderStatus } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
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

    const db = getDatabase();
    const updatedOrder = await transitionOrderStatus(db, params.id, status as OrderStatus);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update order status.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
