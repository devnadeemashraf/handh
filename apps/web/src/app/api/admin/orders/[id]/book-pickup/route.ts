import { NextResponse } from 'next/server';

import {
  createOrderFulfillment,
  findOrderById,
  getSharedDbClient,
  recordAdminAuditLog
} from '@hh/db';
import { BookPickupInputSchema } from '@hh/domain';

import type { ShippingAddress } from '@hh/db';

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
  const { id } = await props.params;
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json().catch(() => ({}));
    const parsed = BookPickupInputSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const order = await findOrderById(db, id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'paid' && order.status !== 'processing') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot book pickup for order in '${order.status}' status. Must be paid or processing.`
        },
        { status: 400 }
      );
    }

    const {
      providerId,
      weightGrams,
      lengthCm,
      widthCm,
      heightCm,
      notes,
      origin: requestOrigin
    } = parsed.data;
    const registry = getShippingRegistry();
    const adapter = registry.getOrThrow(providerId);

    if (!adapter.supportsDoorstepPickup || !adapter.bookDoorstepPickup) {
      return NextResponse.json(
        {
          success: false,
          error: `Provider '${providerId}' does not support doorstep pickup booking.`
        },
        { status: 400 }
      );
    }

    const shippingAddr = order.shippingAddress as ShippingAddress;

    // Resolve warehouse origin from request override or validated environment (E-COM-067)
    const origin = requestOrigin ?? {
      name: process.env['WAREHOUSE_NAME'] || 'H&H Artisan Atelier',
      phone: process.env['WAREHOUSE_PHONE'] || '+919876543210',
      line1: process.env['WAREHOUSE_LINE1'] || 'Banjara Hills Road No 10',
      ...(process.env['WAREHOUSE_LINE2'] ? { line2: process.env['WAREHOUSE_LINE2'] } : {}),
      city: process.env['WAREHOUSE_CITY'] || 'Hyderabad',
      state: process.env['WAREHOUSE_STATE'] || 'Telangana',
      postalCode: process.env['WAREHOUSE_POSTAL_CODE'] || '500034',
      country: process.env['WAREHOUSE_COUNTRY'] || 'India'
    };

    // 1. Call adapter to book doorstep courier pickup
    const pickupResult = await adapter.bookDoorstepPickup({
      orderId: order.id,
      orderNumber: order.orderNumber,
      origin,
      destination: {
        fullName: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        line1: shippingAddr.line1,
        ...(shippingAddr.line2 ? { line2: shippingAddr.line2 } : {}),
        city: shippingAddr.city,
        state: shippingAddr.state,
        postalCode: shippingAddr.postalCode,
        country: shippingAddr.country || 'India'
      },
      package: {
        weightGrams,
        lengthCm,
        widthCm,
        heightCm,
        declaredValueMinor: order.totalMinor
      }
    });

    // 2. Persist fulfillment in database
    const fulfillmentResult = await createOrderFulfillment(db, {
      orderId: order.id,
      courierProvider: 'delhivery',
      shippingProviderId: providerId,
      trackingNumber: pickupResult.awb,
      labelUrl: pickupResult.labelUrl,
      pickupToken: pickupResult.pickupToken,
      notes: notes ?? `Booked via ${adapter.name}`
    });

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'order:pickup_booked',
      entityType: 'order',
      entityId: id,
      details: {
        fulfillmentId: fulfillmentResult.fulfillment.id,
        awb: pickupResult.awb,
        shippingProviderId: providerId,
        pickupToken: pickupResult.pickupToken ?? null,
        originCity: origin.city
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      fulfillment: fulfillmentResult.fulfillment,
      order: fulfillmentResult.order,
      pickupResult
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to book doorstep pickup.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
