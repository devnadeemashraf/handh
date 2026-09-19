import { NextResponse } from 'next/server';
import { createDbClient, updateProductStatus } from '@hh/db';
import { UpdateProductStatusSchema } from '@hh/domain';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function PATCH(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = UpdateProductStatusSchema.safeParse(json);

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

    const db = getDatabase();
    await updateProductStatus(db, parseResult.data);

    return NextResponse.json({
      success: true,
      message: 'Product status updated successfully.'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update product status.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
