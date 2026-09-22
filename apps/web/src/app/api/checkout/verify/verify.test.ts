import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as verifyPayment } from './route';

describe('Checkout Payment Verification API Route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid payload with 400', async () => {
    const req = new Request('http://localhost:3000/api/checkout/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'payload' })
    });

    const res = await verifyPayment(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid payment verification payload.');
  });

  it('strictly rejects mock signatures when NODE_ENV is production (E-COM-054)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'secret_production_key_12345678901234');

    const req = new Request('http://localhost:3000/api/checkout/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '11111111-2222-3333-4444-555555555555',
        razorpayOrderId: 'order_mock_12345678',
        razorpayPaymentId: 'pay_mock_12345678',
        razorpaySignature: 'mock_signature_attempt'
      })
    });

    const res = await verifyPayment(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Payment verification failed');
  });

  it('fails closed in production if RAZORPAY_KEY_SECRET is placeholder (E-COM-054)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RAZORPAY_KEY_SECRET', 'placeholder_secret_never_use_in_prod');

    const req = new Request('http://localhost:3000/api/checkout/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: '11111111-2222-3333-4444-555555555555',
        razorpayOrderId: 'order_mock_12345678',
        razorpayPaymentId: 'pay_mock_12345678',
        razorpaySignature: 'mock_signature_attempt'
      })
    });

    const res = await verifyPayment(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Payment gateway configuration error.');
  });
});
