import { NextResponse } from 'next/server';

import { createOrderFulfillment, getSharedDbClient, recordAdminAuditLog } from '@hh/db';
import { CreateFulfillmentRequestSchema } from '@hh/domain';

import { getAdminSession } from '../../../../../../lib/admin-auth';
import { getClientIp } from '../../../../../../lib/client-ip';
import { getShippingRegistry } from '../../../../../../lib/shipping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
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
    const { orderId, courierProvider, trackingNumber, notes } = parseResult.data;
    const registerWithTracker = json.registerWithTracker !== false;

    let shippingProviderId = 'manual';
    if (registerWithTracker) {
      try {
        const registry = getShippingRegistry();
        const tracker = registry.get('trackingmore') || registry.get('manual');
        if (tracker?.registerCounterAwb) {
          await tracker.registerCounterAwb({
            awb: trackingNumber,
            courierSlug: courierProvider
          });
          shippingProviderId = tracker.providerId;
        }
      } catch {
        // Fallback to manual if external registration fails
        shippingProviderId = 'manual';
      }
    }

    const result = await createOrderFulfillment(db, {
      orderId,
      courierProvider,
      trackingNumber,
      shippingProviderId,
      notes
    });

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'order:fulfillment_created',
      entityType: 'order',
      entityId: params.id,
      details: {
        fulfillmentId: result.fulfillment.id,
        trackingNumber,
        courierProvider,
        shippingProviderId,
        notes: notes ?? null
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

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
