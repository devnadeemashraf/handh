import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { invalidateCatalogCache } from '@/lib/catalog-cache';
import { getClientIp } from '@/lib/client-ip';

import { getSharedDbClient, recordAdminAuditLog, updateProductStatus } from '@hh/db';
import { UpdateProductStatusSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
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

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'inventory:status_updated',
      entityType: 'product',
      entityId: parseResult.data.productId,
      details: {
        status: parseResult.data.status
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    // Invalidate edge & Redis catalog cache upon status change (E-COM-116)
    await invalidateCatalogCache();

    return NextResponse.json({
      success: true,
      message: 'Product status updated successfully.'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update product status.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
