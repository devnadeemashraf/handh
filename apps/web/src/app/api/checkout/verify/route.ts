import { NextResponse } from 'next/server';

import {
  confirmPaymentAndCaptureOrder,
  getSharedDbClient,
  recordPaymentFailure,
  verifyRazorpayPaymentSignature
} from '@hh/db';
import { DomainError, PaymentVerificationSchema } from '@hh/domain';

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

    const isProduction = process.env.NODE_ENV === 'production';
    const enableDevMocks =
      !isProduction &&
      (process.env['ENABLE_DEV_MOCKS'] === 'true' || process.env.NODE_ENV === 'test');

    const keySecret = process.env['RAZORPAY_KEY_SECRET'] ?? '';
    if (isProduction && (!keySecret || keySecret.includes('placeholder'))) {
      console.error('CRITICAL: RAZORPAY_KEY_SECRET is missing or using placeholder in production!');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration error.' },
        { status: 500 }
      );
    }

    const isMock =
      enableDevMocks &&
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

    // Capture payment and mark order paid atomically with amount and currency checks (E-COM-053)
    const result = await confirmPaymentAndCaptureOrder(db, {
      orderId,
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
      amountMinor: parseResult.data.amountMinor,
      currency: parseResult.data.currency
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
