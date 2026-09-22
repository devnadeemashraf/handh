import { NextResponse } from 'next/server';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/client-ip';

import { recordAdminAuditLog, updateVariantPrice } from '@hh/db';
import { UpdateVariantPriceSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = UpdateVariantPriceSchema.safeParse(json);

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

    const db = getSharedDb();
    await updateVariantPrice(db, parseResult.data);

    // Record immutable audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'inventory:price_updated',
      entityType: 'product_variant',
      entityId: parseResult.data.variantId,
      details: {
        priceMinor: parseResult.data.priceMinor
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      message: 'Variant price updated successfully.'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update price.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
