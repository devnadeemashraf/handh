import { and, eq, ne, sql } from 'drizzle-orm';

import {
  assertCanTransitionOrder,
  assertCanTransitionPayment,
  type CurrencyCode,
  NotFoundError,
  PaymentAlreadyProcessedError,
  ValidationError
} from '@hh/domain';

import {
  inventoryLevels,
  inventoryReservations,
  type Order,
  orderItems,
  orders,
  outboxEvents,
  type PaymentAttempt,
  paymentAttempts,
  type WebhookEvent,
  webhookEvents
} from '../schema';

import type { DatabaseClient, DbTransaction } from '../index';

export interface CreatePaymentAttemptParams {
  orderId: string;
  provider?: string;
  providerOrderId: string;
  amountMinor: number;
  currency?: CurrencyCode;
}

export interface ConfirmPaymentParams {
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  amountMinor?: number | undefined;
  currency?: string | undefined;
}

export interface RecordPaymentFailureParams {
  providerOrderId: string;
  errorCode?: string;
  errorDescription?: string;
}

export interface ProcessWebhookParams {
  provider: string;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processFn: (tx: DbTransaction) => Promise<void>;
}

/**
 * Creates a new payment attempt record for an initiated gateway session.
 */
export async function createPaymentAttempt(
  db: DatabaseClient,
  params: CreatePaymentAttemptParams
): Promise<PaymentAttempt> {
  const { orderId, provider = 'razorpay', providerOrderId, amountMinor, currency = 'INR' } = params;

  const [attempt] = await db
    .insert(paymentAttempts)
    .values({
      orderId,
      provider,
      providerOrderId,
      amountMinor,
      currency,
      status: 'initiated'
    })
    .returning();

  if (!attempt) {
    throw new Error('Failed to create payment attempt record.');
  }

  return attempt;
}

/**
 * Finds a payment attempt by the payment provider's order ID (e.g. Razorpay order_id).
 */
export async function findPaymentAttemptByProviderOrderId(
  db: DatabaseClient | DbTransaction,
  providerOrderId: string
): Promise<PaymentAttempt | null> {
  const attempts = await db
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.providerOrderId, providerOrderId))
    .limit(1);

  return attempts[0] ?? null;
}

/**
 * Finds all payment attempts for a given internal order ID.
 */
export async function findPaymentAttemptsByOrderId(
  db: DatabaseClient | DbTransaction,
  orderId: string
): Promise<PaymentAttempt[]> {
  return await db
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.orderId, orderId))
    .orderBy(paymentAttempts.createdAt);
}

/**
 * Confirms payment verification atomically:
 * 1. Checks order and asserts valid state transitions.
 * 2. Validates amount and currency integrity against the authoritative order (E-COM-053).
 * 3. Marks order as 'paid' with paymentStatus 'captured'.
 * 4. Marks payment attempt as 'captured' with signature and payment ID.
 * 5. Consumes active inventory reservations and decrements stock (reserved & on_hand).
 */
export async function confirmPaymentAndCaptureOrder(
  db: DatabaseClient | DbTransaction,
  params: ConfirmPaymentParams
): Promise<{ order: Order; paymentAttempt: PaymentAttempt }> {
  const { orderId, providerOrderId, providerPaymentId, providerSignature } = params;

  try {
    return await db.transaction(async (tx) => {
      // 1. Lock and retrieve order
      const orderRows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');

      const order = orderRows[0];
      if (!order) {
        throw new NotFoundError('Order', orderId);
      }

      // If order is already paid, handle idempotently
      if (order.status === 'paid' && order.paymentStatus === 'captured') {
        const existingAttempt = await tx
          .select()
          .from(paymentAttempts)
          .where(
            and(
              eq(paymentAttempts.orderId, orderId),
              eq(paymentAttempts.providerOrderId, providerOrderId)
            )
          )
          .limit(1);

        if (existingAttempt[0]?.status === 'captured') {
          return { order, paymentAttempt: existingAttempt[0] };
        }
        throw new PaymentAlreadyProcessedError(providerOrderId);
      }

      // Verify state transitions
      assertCanTransitionOrder(order.status, 'paid');
      assertCanTransitionPayment(order.paymentStatus, 'captured');

      // 2. Lock and retrieve the payment attempt
      const attemptRows = await tx
        .select()
        .from(paymentAttempts)
        .where(
          and(
            eq(paymentAttempts.orderId, orderId),
            eq(paymentAttempts.providerOrderId, providerOrderId)
          )
        )
        .for('update');

      const attempt = attemptRows[0];
      if (!attempt) {
        throw new NotFoundError('PaymentAttempt', providerOrderId);
      }

      // 3. Financial Integrity Validation (E-COM-053)
      // Check initiated attempt amount against authoritative order total
      if (attempt.amountMinor !== order.totalMinor) {
        await tx
          .update(paymentAttempts)
          .set({
            status: 'failed',
            errorCode: 'AMOUNT_MISMATCH',
            errorDescription: `Initiated attempt amount ${attempt.amountMinor} does not match order total ${order.totalMinor}`,
            updatedAt: new Date()
          })
          .where(eq(paymentAttempts.id, attempt.id));

        throw new ValidationError(
          `Payment attempt amount mismatch: expected ₹${(order.totalMinor / 100).toFixed(2)}, but attempt was ₹${(attempt.amountMinor / 100).toFixed(2)}.`,
          'AMOUNT_MISMATCH'
        );
      }

      if (attempt.currency.toUpperCase() !== order.currency.toUpperCase()) {
        await tx
          .update(paymentAttempts)
          .set({
            status: 'failed',
            errorCode: 'CURRENCY_MISMATCH',
            errorDescription: `Initiated attempt currency ${attempt.currency} does not match order currency ${order.currency}`,
            updatedAt: new Date()
          })
          .where(eq(paymentAttempts.id, attempt.id));

        throw new ValidationError(
          `Payment currency mismatch: expected ${order.currency}, but attempt was ${attempt.currency}.`,
          'CURRENCY_MISMATCH'
        );
      }

      // Check explicitly captured amount if provided by webhook or verification payload
      if (params.amountMinor !== undefined && params.amountMinor !== order.totalMinor) {
        await tx
          .update(paymentAttempts)
          .set({
            status: 'failed',
            errorCode: 'AMOUNT_MISMATCH',
            errorDescription: `Captured amount ${params.amountMinor} does not match order total ${order.totalMinor}`,
            updatedAt: new Date()
          })
          .where(eq(paymentAttempts.id, attempt.id));

        throw new ValidationError(
          `Captured payment amount mismatch: expected ₹${(order.totalMinor / 100).toFixed(2)}, but received ₹${(params.amountMinor / 100).toFixed(2)}.`,
          'AMOUNT_MISMATCH'
        );
      }

      if (
        params.currency !== undefined &&
        params.currency.toUpperCase() !== order.currency.toUpperCase()
      ) {
        await tx
          .update(paymentAttempts)
          .set({
            status: 'failed',
            errorCode: 'CURRENCY_MISMATCH',
            errorDescription: `Captured currency ${params.currency} does not match order currency ${order.currency}`,
            updatedAt: new Date()
          })
          .where(eq(paymentAttempts.id, attempt.id));

        throw new ValidationError(
          `Captured payment currency mismatch: expected ${order.currency}, but received ${params.currency}.`,
          'CURRENCY_MISMATCH'
        );
      }

      const now = new Date();

      // 4. Update the Order to 'paid' and 'captured'
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: 'paid',
          paymentStatus: 'captured',
          updatedAt: now
        })
        .where(eq(orders.id, orderId))
        .returning();

      // 5. Update the Payment Attempt to 'captured'
      const [updatedAttempt] = await tx
        .update(paymentAttempts)
        .set({
          status: 'captured',
          providerPaymentId,
          providerSignature,
          updatedAt: now
        })
        .where(eq(paymentAttempts.id, attempt.id))
        .returning();

      // 6. Consume active inventory reservations and decrement on_hand + reserved
      const activeReservations = await tx
        .select()
        .from(inventoryReservations)
        .where(
          and(
            eq(inventoryReservations.orderId, orderId),
            eq(inventoryReservations.status, 'active')
          )
        )
        .for('update');

      for (const res of activeReservations) {
        // Mark reservation as consumed
        await tx
          .update(inventoryReservations)
          .set({
            status: 'consumed',
            updatedAt: now
          })
          .where(eq(inventoryReservations.id, res.id));

        // Decrement both reserved and on_hand stock
        await tx
          .update(inventoryLevels)
          .set({
            reserved: sql`${inventoryLevels.reserved} - ${res.quantity}`,
            onHand: sql`${inventoryLevels.onHand} - ${res.quantity}`,
            updatedAt: now
          })
          .where(eq(inventoryLevels.variantId, res.variantId));
      }

      // 7. Record outbox event for transactional customer & admin notification
      const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));

      const itemsSnapshot = items.map((it) => ({
        title: it.productNameSnapshot,
        variantTitle: it.variantNameSnapshot,
        quantity: it.quantity,
        unitPriceMinor: it.unitPriceMinor,
        subtotalMinor: it.totalPriceMinor
      }));

      await tx.insert(outboxEvents).values({
        eventName: 'order.paid',
        aggregateType: 'order',
        aggregateId: order.id,
        payload: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          totalMinor: order.totalMinor,
          currency: order.currency,
          items: itemsSnapshot,
          providerPaymentId,
          paidAt: now.toISOString()
        },
        status: 'pending'
      });

      return {
        order: updatedOrder!,
        paymentAttempt: updatedAttempt!
      };
    });
  } catch (err) {
    if (
      err instanceof ValidationError &&
      (err.details === 'AMOUNT_MISMATCH' || err.details === 'CURRENCY_MISMATCH')
    ) {
      const errorCode = String(err.details);
      await db
        .update(paymentAttempts)
        .set({
          status: 'failed',
          errorCode,
          errorDescription: err.message,
          updatedAt: new Date()
        })
        .where(eq(paymentAttempts.providerOrderId, providerOrderId));
    }
    throw err;
  }
}

/**
 * Records payment failure on a payment attempt.
 * Protected against out-of-order webhooks downgrading already-captured payments (E-COM-057).
 */
export async function recordPaymentFailure(
  db: DatabaseClient | DbTransaction,
  params: RecordPaymentFailureParams
): Promise<PaymentAttempt | null> {
  const { providerOrderId, errorCode, errorDescription } = params;

  const updateFields: {
    status: 'failed';
    updatedAt: Date;
    errorCode?: string;
    errorDescription?: string;
  } = {
    status: 'failed',
    updatedAt: new Date(),
    ...(errorCode ? { errorCode } : {}),
    ...(errorDescription ? { errorDescription } : {})
  };

  const [updated] = await db
    .update(paymentAttempts)
    .set(updateFields)
    .where(
      and(
        eq(paymentAttempts.providerOrderId, providerOrderId),
        ne(paymentAttempts.status, 'captured')
      )
    )
    .returning();

  return updated ?? null;
}

/**
 * Records and processes incoming webhook events with idempotency and replay protection.
 * If the event has already been successfully processed, skips processing.
 */
export async function recordAndProcessWebhookEvent(
  db: DatabaseClient,
  params: ProcessWebhookParams
): Promise<{ processed: boolean; duplicate: boolean }> {
  const { provider, eventId, eventType, payload, processFn } = params;

  // 1. Check if event was already received and processed
  const existing = await db
    .select()
    .from(webhookEvents)
    .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)))
    .limit(1);

  if (existing[0]?.status === 'processed') {
    return { processed: true, duplicate: true };
  }

  let webhookRecord: WebhookEvent;

  if (existing[0]) {
    webhookRecord = existing[0];
  } else {
    // Insert new pending webhook record with concurrency conflict handling
    try {
      const [inserted] = await db
        .insert(webhookEvents)
        .values({
          provider,
          eventId,
          eventType,
          payload,
          status: 'pending'
        })
        .onConflictDoNothing({ target: [webhookEvents.provider, webhookEvents.eventId] })
        .returning();

      if (!inserted) {
        // Concurrent thread inserted this exact webhook event
        const recheck = await db
          .select()
          .from(webhookEvents)
          .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)))
          .limit(1);

        if (recheck[0]?.status === 'processed') {
          return { processed: true, duplicate: true };
        }
        webhookRecord = recheck[0]!;
      } else {
        webhookRecord = inserted;
      }
    } catch {
      const recheck = await db
        .select()
        .from(webhookEvents)
        .where(and(eq(webhookEvents.provider, provider), eq(webhookEvents.eventId, eventId)))
        .limit(1);

      if (recheck[0]?.status === 'processed') {
        return { processed: true, duplicate: true };
      }
      webhookRecord = recheck[0]!;
    }
  }

  try {
    // Execute business processing in transaction
    await db.transaction(async (tx) => {
      await processFn(tx);

      await tx
        .update(webhookEvents)
        .set({
          status: 'processed',
          processedAt: new Date()
        })
        .where(eq(webhookEvents.id, webhookRecord.id));
    });

    return { processed: true, duplicate: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(webhookEvents)
      .set({
        status: 'failed',
        errorMessage: message
      })
      .where(eq(webhookEvents.id, webhookRecord.id));

    throw err;
  }
}
