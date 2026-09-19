import { describe, expect, it } from 'vitest';

import {
  createGatewayOrder,
  generateRazorpayPaymentSignature,
  generateRazorpayWebhookSignature,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature
} from './services';

describe('Razorpay Server Cryptographic Signatures', () => {
  const secret = 'super_secret_key_12345';
  const orderId = 'order_DAvD6x078N2p2A';
  const paymentId = 'pay_29Ae07wjh5wQ';

  it('generates deterministic HMAC-SHA256 signature for payment callback', () => {
    const sig1 = generateRazorpayPaymentSignature(orderId, paymentId, secret);
    const sig2 = generateRazorpayPaymentSignature(orderId, paymentId, secret);

    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex is 64 characters
  });

  it('verifies genuine payment callback signature', () => {
    const validSignature = generateRazorpayPaymentSignature(orderId, paymentId, secret);
    const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, validSignature, secret);

    expect(isValid).toBe(true);
  });

  it('rejects tampered signature', () => {
    const validSignature = generateRazorpayPaymentSignature(orderId, paymentId, secret);
    const tampered = validSignature.substring(0, 63) + (validSignature[63] === 'a' ? 'b' : 'a');

    const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, tampered, secret);
    expect(isValid).toBe(false);
  });

  it('rejects tampered payment ID or order ID', () => {
    const validSignature = generateRazorpayPaymentSignature(orderId, paymentId, secret);

    const isValidMismatchPayment = verifyRazorpayPaymentSignature(
      orderId,
      'pay_tampered_id',
      validSignature,
      secret
    );
    expect(isValidMismatchPayment).toBe(false);

    const isValidMismatchOrder = verifyRazorpayPaymentSignature(
      'order_tampered_id',
      paymentId,
      validSignature,
      secret
    );
    expect(isValidMismatchOrder).toBe(false);
  });

  it('rejects verification if secret is incorrect', () => {
    const validSignature = generateRazorpayPaymentSignature(orderId, paymentId, secret);
    const isValid = verifyRazorpayPaymentSignature(
      orderId,
      paymentId,
      validSignature,
      'wrong_secret'
    );

    expect(isValid).toBe(false);
  });

  it('safely handles empty or malformed inputs without throwing', () => {
    expect(verifyRazorpayPaymentSignature('', paymentId, 'sig', secret)).toBe(false);
    expect(verifyRazorpayPaymentSignature(orderId, '', 'sig', secret)).toBe(false);
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, '', secret)).toBe(false);
    expect(verifyRazorpayPaymentSignature(orderId, paymentId, 'sig', '')).toBe(false);
  });

  it('verifies valid webhook signature and rejects tampered webhook payload', () => {
    const webhookSecret = 'whsec_9876543210';
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: paymentId, amount: 59900 } } }
    });

    const signature = generateRazorpayWebhookSignature(payload, webhookSecret);
    expect(verifyRazorpayWebhookSignature(payload, signature, webhookSecret)).toBe(true);

    // Tampered payload body
    const tamperedPayload = payload.replace('59900', '100');
    expect(verifyRazorpayWebhookSignature(tamperedPayload, signature, webhookSecret)).toBe(false);

    // Wrong secret
    expect(verifyRazorpayWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
  });

  it('generates simulated gateway order when placeholder credentials are used', async () => {
    const result = await createGatewayOrder({
      keyId: 'rzp_test_placeholder_key_id',
      keySecret: 'placeholder_secret_never_use_in_prod',
      amountMinor: 199900,
      currency: 'INR',
      receipt: 'HH-2026-X8K2P'
    });

    expect(result.id).toMatch(/^order_mock_/);
    expect(result.amountMinor).toBe(199900);
    expect(result.currency).toBe('INR');
    expect(result.receipt).toBe('HH-2026-X8K2P');
  });
});
