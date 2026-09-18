import { NextResponse } from 'next/server';
import { createDbClient, findOrderById, createPaymentAttempt, createGatewayOrder } from '@hh/db';
import { PaymentOrderRequestSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
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

    const { orderId } = parseResult.data;
    const db = getDatabase();

    const order = await findOrderById(db, orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order could not be found.' },
        { status: 404 }
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

    const keyId = process.env['RAZORPAY_KEY_ID'] ?? 'rzp_test_placeholder_key_id';
    const keySecret = process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret_never_use_in_prod';

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

    // 2. Record payment attempt
    await createPaymentAttempt(db, {
      orderId: order.id,
      provider: 'razorpay',
      providerOrderId: gatewayOrder.id,
      amountMinor: order.totalMinor,
      currency: 'INR'
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: gatewayOrder.id,
      amountMinor: order.totalMinor,
      currency: 'INR',
      keyId,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone
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
