import { createHmac, timingSafeEqual } from 'node:crypto';

import type { CurrencyCode, RazorpayOrderResult } from '@hh/domain';

export interface CreateGatewayOrderParams {
  keyId: string;
  keySecret: string;
  amountMinor: number;
  currency?: CurrencyCode;
  receipt: string;
  notes?: Record<string, string>;
}

/**
 * Creates an order with Razorpay.
 * If development placeholder credentials are detected, simulates a mock gateway order
 * so local development and offline verification function seamlessly.
 */
export async function createGatewayOrder(
  params: CreateGatewayOrderParams
): Promise<RazorpayOrderResult> {
  const { keyId, keySecret, amountMinor, currency = 'INR', receipt, notes } = params;

  const isMockCredentials =
    keyId.includes('placeholder') ||
    keySecret.includes('placeholder') ||
    keyId.startsWith('rzp_test_placeholder');

  const isProduction = process.env['NODE_ENV'] === 'production';
  if (isProduction && isMockCredentials) {
    throw new Error('Razorpay production keys are missing or set to placeholder values.');
  }

  if (isMockCredentials) {
    const mockId = `order_mock_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
    return {
      id: mockId,
      amountMinor,
      currency,
      receipt,
      status: 'created'
    };
  }

  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`
    },
    body: JSON.stringify({
      amount: amountMinor,
      currency,
      receipt,
      notes: notes ?? {}
    }),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Razorpay order creation failed (status ${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  };

  return {
    id: data.id,
    amountMinor: data.amount,
    currency: data.currency as CurrencyCode,
    receipt: data.receipt,
    status: data.status
  };
}

/**
 * Generates an HMAC-SHA256 signature for Razorpay payment callback verification.
 * Spec: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret)
 */
export function generateRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  secret: string
): string {
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

const HEX_64_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Verifies the authenticity of a Razorpay payment response using constant-time comparison
 * to prevent timing side-channel attacks.
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !signature || !secret) {
    return false;
  }

  const trimmedSig = signature.trim();
  if (!HEX_64_REGEX.test(trimmedSig)) {
    return false;
  }

  const expectedSignature = generateRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    secret
  );

  const sigBuffer = Buffer.from(trimmedSig, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Generates an HMAC-SHA256 signature for a raw webhook request body.
 */
export function generateRazorpayWebhookSignature(rawBody: string, secret: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

/**
 * Verifies that a webhook request originated from Razorpay using the X-Razorpay-Signature header.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const trimmedSig = signature.trim();
  if (!HEX_64_REGEX.test(trimmedSig)) {
    return false;
  }

  const expectedSignature = generateRazorpayWebhookSignature(rawBody, secret);

  const sigBuffer = Buffer.from(trimmedSig, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(sigBuffer, expectedBuffer);
}
