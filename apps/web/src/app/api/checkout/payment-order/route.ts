import { NextResponse } from 'next/server';

import {
  createGatewayOrder,
  createPaymentAttempt,
  findOrderById,
  findPaymentAttemptsByOrderId,
  findStoreBySlug,
  getSharedDbClient
} from '@hh/db';
import { PaymentOrderRequestSchema, resolveServiceControl } from '@hh/domain';

import { getAdminSession } from '../../../../lib/admin-auth';
import { getCurrentUser } from '../../../../lib/auth';
import { verifyOrderReceiptToken } from '../../../../lib/receipt-token';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = PaymentOrderRequestSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid order ID provided.',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { orderId, token: bodyToken } = parseResult.data;
    const headerToken = request.headers.get('x-order-token');
    const token = bodyToken || headerToken;

    const db = getDatabase();

    const order = await findOrderById(db, orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order could not be found.' },
        { status: 404 }
      );
    }

    // Authorization & Ownership Verification (E-COM-045)
    const currentUser = await getCurrentUser();
    const isOwner = Boolean(currentUser && order.userId && currentUser.id === order.userId);
    const adminSession = !isOwner ? await getAdminSession() : null;
    const isAdmin = Boolean(adminSession);
    const isTokenValid = Boolean(
      token && verifyOrderReceiptToken(token, order.id, order.orderNumber)
    );

    if (!isOwner && !isAdmin && !isTokenValid) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          error: 'You are not authorized to initialize payment for this order.'
        },
        { status: 403 }
      );
    }

    if (order.status !== 'pending_payment') {
      return NextResponse.json(
        {
          success: false,
          error: `Order is not pending payment (current status: ${order.status}).`
        },
        { status: 400 }
      );
    }

    const store = await findStoreBySlug(db, 'hh');
    if (store) {
      const serviceControl = resolveServiceControl(
        (store.settings as Record<string, unknown> | undefined)?.['serviceControl']
      );
      if (
        serviceControl.operatingStatus === 'maintenance' ||
        !serviceControl.checkoutEnabled ||
        !serviceControl.paymentsEnabled
      ) {
        return NextResponse.json(
          {
            success: false,
            code: 'SERVICE_UNAVAILABLE',
            error: serviceControl.maintenanceNotice
          },
          { status: 503 }
        );
      }
    }

    const keyId = process.env['RAZORPAY_KEY_ID'] ?? 'rzp_test_placeholder_key_id';
    const keySecret = process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret_never_use_in_prod';

    // Reuse existing initiated payment attempt if present to prevent redundant orders (E-COM-045)
    const existingAttempts = await findPaymentAttemptsByOrderId(db, order.id);
    const reusableAttempt = existingAttempts.find(
      (a) =>
        a.provider === 'razorpay' && a.status === 'initiated' && a.amountMinor === order.totalMinor
    );

    let gatewayOrderId: string;
    if (reusableAttempt) {
      gatewayOrderId = reusableAttempt.providerOrderId;
    } else {
      // 1. Create order on Razorpay (or mock in test/placeholder environment)
      const gatewayOrder = await createGatewayOrder({
        keyId,
        keySecret,
        amountMinor: order.totalMinor,
        currency: 'INR',
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          orderNumber: order.orderNumber
        }
      });
      gatewayOrderId = gatewayOrder.id;

      // 2. Record payment attempt
      await createPaymentAttempt(db, {
        orderId: order.id,
        provider: 'razorpay',
        providerOrderId: gatewayOrderId,
        amountMinor: order.totalMinor,
        currency: 'INR'
      });
    }

    // 3. Return sanitized response omitting customer PII (E-COM-045)
    return NextResponse.json({
      success: true,
      razorpayOrderId: gatewayOrderId,
      amountMinor: order.totalMinor,
      currency: 'INR',
      keyId,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Payment order initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while initializing payment with gateway.'
      },
      { status: 500 }
    );
  }
}
