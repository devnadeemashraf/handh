import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { invalidateCatalogCache } from '@/lib/catalog-cache';
import { getClientIp } from '@/lib/client-ip';

import {
  getSharedDbClient,
  getStoreServiceControl,
  recordAdminAuditLog,
  updateStoreServiceControl
} from '@hh/db';
import { ServiceControlConfigSchema } from '@hh/domain';

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
    const serviceControl = await getStoreServiceControl(db, 'hh');

    return NextResponse.json({ success: true, serviceControl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch service control.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = ServiceControlConfigSchema.partial().safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateStoreServiceControl(db, 'hh', parseResult.data);

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'settings:service_control_updated',
      entityType: 'store_settings',
      entityId: 'hh',
      details: {
        changes: parseResult.data,
        updated
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    // Invalidate edge & Redis storefront and catalog cache upon service control update (E-COM-116)
    await invalidateCatalogCache();

    return NextResponse.json({
      success: true,
      message: 'Service control settings updated successfully.',
      serviceControl: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update service control.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
