import { NextResponse } from 'next/server';

import {
  confirmPaymentAndCaptureOrder,
  findPaymentAttemptByProviderOrderId,
  getSharedDbClient,
  recordAndProcessWebhookEvent,
  recordPaymentFailure,
  verifyRazorpayWebhookSignature
} from '@hh/db';
import { RazorpayWebhookEventSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const enableDevMocks =
      !isProduction &&
      (process.env['ENABLE_DEV_MOCKS'] === 'true' || process.env.NODE_ENV === 'test');

    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? '';
    if (isProduction && (!webhookSecret || webhookSecret.includes('placeholder'))) {
      console.error(
        'CRITICAL: RAZORPAY_WEBHOOK_SECRET is missing or using placeholder in production!'
      );
      return NextResponse.json({ error: 'Webhook gateway configuration error.' }, { status: 500 });
    }

    const isMock = enableDevMocks && (signature.startsWith('mock_') || rawBody.includes('mock'));

    const isSignatureValid =
      isMock || verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);

    if (!isSignatureValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const json = JSON.parse(rawBody);
    const parseResult = RazorpayWebhookEventSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid webhook event format', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const event = parseResult.data;
    const db = getDatabase();

    // Event ID priority: Native Razorpay header -> payment/order entity ID -> fallback composite (E-COM-052)
    const headerEventId = request.headers.get('x-razorpay-event-id');
    const paymentEntityId = event.payload.payment?.entity?.id;
    const orderEntityId = event.payload.order?.entity?.id;
    const eventId =
      headerEventId ||
      (paymentEntityId ? `${paymentEntityId}_${event.event}` : null) ||
      (orderEntityId ? `${orderEntityId}_${event.event}` : null) ||
      `${event.account_id}_${event.created_at}_${event.event}`;

    const webhookResult = await recordAndProcessWebhookEvent(db, {
      provider: 'razorpay',
      eventId,
      eventType: event.event,
      payload: json as Record<string, unknown>,
      processFn: async (tx) => {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          const paymentEntity = event.payload.payment?.entity;
          const providerOrderId = paymentEntity?.order_id ?? event.payload.order?.entity.id;

          if (providerOrderId && paymentEntity) {
            const attempt = await findPaymentAttemptByProviderOrderId(tx, providerOrderId);
            if (attempt && attempt.status !== 'captured') {
              await confirmPaymentAndCaptureOrder(tx, {
                orderId: attempt.orderId,
                providerOrderId,
                providerPaymentId: paymentEntity.id,
                providerSignature: signature,
                amountMinor: paymentEntity.amount,
                currency: paymentEntity.currency
              });
            }
          }
        } else if (event.event === 'payment.failed') {
          const paymentEntity = event.payload.payment?.entity;
          const providerOrderId = paymentEntity?.order_id;

          if (providerOrderId && paymentEntity) {
            await recordPaymentFailure(tx, {
              providerOrderId,
              errorCode: paymentEntity.error_code ?? 'PAYMENT_FAILED',
              errorDescription: paymentEntity.error_description ?? 'Payment failed'
            });
          }
        }
      }
    });

    return NextResponse.json({
      status: 'ok',
      processed: webhookResult.processed,
      duplicate: webhookResult.duplicate
    });
  } catch (error) {
    console.error('Razorpay webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing webhook' },
      { status: 500 }
    );
  }
}
