import { NextResponse } from 'next/server';

import { getSharedDbClient, receiveFulfillmentReturn } from '@hh/db';
import { ReturnReceiveSchema } from '@hh/domain';

import { getAdminSession } from '../../../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json().catch(() => ({}));
    const parsed = ReturnReceiveSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = await receiveFulfillmentReturn(db, {
      fulfillmentId: id,
      note: parsed.data.note,
      restock: parsed.data.restock
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process return intake.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
