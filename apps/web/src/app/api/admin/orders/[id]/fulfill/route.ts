import { NextResponse } from 'next/server';
import { createDbClient, createOrderFulfillment } from '@hh/db';
import { CreateFulfillmentRequestSchema } from '@hh/domain';
import { getAdminSession } from '../../../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = CreateFulfillmentRequestSchema.safeParse({
      ...json,
      orderId: params.id
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed.',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const result = await createOrderFulfillment(db, parseResult.data);

    return NextResponse.json({
      success: true,
      fulfillment: result.fulfillment,
      order: result.order
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record shipment fulfillment.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
