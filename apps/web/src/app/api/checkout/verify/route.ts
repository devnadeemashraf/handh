import { NextResponse } from 'next/server';
import {
  createDbClient,
  confirmPaymentAndCaptureOrder,
  recordPaymentFailure,
  verifyRazorpayPaymentSignature
} from '@hh/db';
import { PaymentVerificationSchema, DomainError } from '@hh/domain';

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
    const parseResult = PaymentVerificationSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment verification payload.',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseResult.data;
    const db = getDatabase();

    const keySecret = process.env['RAZORPAY_KEY_SECRET'] ?? 'placeholder_secret_never_use_in_prod';
    const isMock =
      keySecret.includes('placeholder') &&
      (razorpaySignature.startsWith('mock_') || razorpayOrderId.startsWith('order_mock_'));

    const isSignatureValid =
      isMock ||
      verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        keySecret
      );

    if (!isSignatureValid) {
      await recordPaymentFailure(db, {
        providerOrderId: razorpayOrderId,
        errorCode: 'SIGNATURE_VERIFICATION_FAILED',
        errorDescription: 'Cryptographic HMAC signature mismatch.'
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed. Please contact support if your account was debited.'
        },
        { status: 400 }
      );
    }

    // Capture payment and mark order paid atomically
    const result = await confirmPaymentAndCaptureOrder(db, {
      orderId,
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature
    });

    return NextResponse.json({
      success: true,
      orderNumber: result.order.orderNumber,
      orderId: result.order.id
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.userMessage },
        { status: 400 }
      );
    }

    console.error('Payment verification unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while confirming payment.'
      },
      { status: 500 }
    );
  }
}
