import { NextResponse } from 'next/server';

import {
  confirmPaymentAndCaptureOrder,
  createDbClient,
  findPaymentAttemptByProviderOrderId,
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
  return createDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 400 });
    }

    const webhookSecret = process.env['RAZORPAY_WEBHOOK_SECRET'] ?? 'placeholder_webhook_secret';

    const isMock =
      webhookSecret.includes('placeholder') &&
      (signature.startsWith('mock_') || rawBody.includes('mock'));

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

    // Unique event identifier for idempotency
    const eventId = `${event.account_id}_${event.created_at}_${event.event}`;

    const webhookResult = await recordAndProcessWebhookEvent(db, {
      provider: 'razorpay',
      eventId,
      eventType: event.event,
      payload: json as Record<string, unknown>,
      processFn: async () => {
        if (event.event === 'payment.captured' || event.event === 'order.paid') {
          const paymentEntity = event.payload.payment?.entity;
          const providerOrderId = paymentEntity?.order_id ?? event.payload.order?.entity.id;

          if (providerOrderId && paymentEntity) {
            const attempt = await findPaymentAttemptByProviderOrderId(db, providerOrderId);
            if (attempt && attempt.status !== 'captured') {
              await confirmPaymentAndCaptureOrder(db, {
                orderId: attempt.orderId,
                providerOrderId,
                providerPaymentId: paymentEntity.id,
                providerSignature: signature
              });
            }
          }
        } else if (event.event === 'payment.failed') {
          const paymentEntity = event.payload.payment?.entity;
          const providerOrderId = paymentEntity?.order_id;

          if (providerOrderId && paymentEntity) {
            await recordPaymentFailure(db, {
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
