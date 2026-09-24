import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { invalidateCatalogCache } from '@/lib/catalog-cache';
import { getClientIp } from '@/lib/client-ip';

import {
  getSharedDbClient,
  getStorefrontConfig,
  recordAdminAuditLog,
  updateStorefrontConfig
} from '@hh/db';
import { storefrontConfigSchema } from '@hh/domain';

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
    const config = await getStorefrontConfig(db, 'hh');

    return NextResponse.json({ success: true, config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch brand configuration.';
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
    const parseResult = storefrontConfigSchema.partial().safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateStorefrontConfig(db, 'hh', parseResult.data);

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'settings:brand_updated',
      entityType: 'store_settings',
      entityId: 'hh',
      details: {
        changes: parseResult.data
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    // Invalidate edge & Redis storefront and catalog cache upon brand settings change (E-COM-116)
    await invalidateCatalogCache();

    return NextResponse.json({
      success: true,
      message: 'Storefront brand configuration updated successfully.',
      config: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update brand configuration.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
