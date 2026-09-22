import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as handleRazorpayWebhook } from './route';

describe('Razorpay Webhook API Route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects requests missing signature header with 400', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' })
    });

    const res = await handleRazorpayWebhook(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Missing webhook signature header');
  });

  it('strictly rejects mock signatures when NODE_ENV is production (E-COM-054)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'prod_webhook_secret_0123456789abcdef');

    const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'mock_signature_attempt'
      },
      body: JSON.stringify({
        entity: 'event',
        account_id: 'acc_123',
        event: 'payment.captured',
        created_at: 1726700000,
        contains: ['payment'],
        payload: {}
      })
    });

    const res = await handleRazorpayWebhook(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe('Invalid webhook signature');
  });

  it('fails closed in production if RAZORPAY_WEBHOOK_SECRET is placeholder (E-COM-054)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', 'placeholder_webhook_secret');

    const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'mock_signature_attempt'
      },
      body: JSON.stringify({
        entity: 'event',
        account_id: 'acc_123',
        event: 'payment.captured',
        created_at: 1726700000,
        contains: ['payment'],
        payload: {}
      })
    });

    const res = await handleRazorpayWebhook(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe('Webhook gateway configuration error.');
  });
});
