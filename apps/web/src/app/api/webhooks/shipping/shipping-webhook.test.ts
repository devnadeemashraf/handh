import { afterEach, describe, expect, it, vi } from 'vitest';

import { POST as handleShippingWebhook } from './[provider]/route';

vi.mock('@hh/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hh/db')>();
  return {
    ...actual,
    getSharedDbClient: vi.fn().mockReturnValue({}),
    processShippingWebhookEvent: vi.fn().mockResolvedValue({
      processed: true,
      orderCompleted: false
    })
  };
});

describe('Shipping Carrier Webhook API Route (E-COM-062)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('rejects unsupported provider with 404', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/shipping/unsupported_courier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ awb: '123' })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'unsupported_courier' })
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain('Unsupported shipping provider');
  });

  it('strictly rejects unauthenticated webhooks with 401 when signature is invalid (E-COM-062)', async () => {
    vi.stubEnv('SHIPROCKET_WEBHOOK_SECRET', 'sr_prod_secret_123');

    const req = new Request('http://localhost:3000/api/webhooks/shipping/shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shiprocket-signature': 'attacker_forged_secret'
      },
      body: JSON.stringify({
        awb: 'SR12345678',
        current_status: 'DELIVERED'
      })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'shiprocket' })
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid webhook signature or token.');
  });

  it('fails closed with 500 in production when carrier secret is unconfigured or placeholder (E-COM-062)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SHIPROCKET_WEBHOOK_SECRET', '');

    const req = new Request('http://localhost:3000/api/webhooks/shipping/shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shiprocket-signature': 'some_signature'
      },
      body: JSON.stringify({
        awb: 'SR12345678',
        current_status: 'DELIVERED'
      })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'shiprocket' })
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Shipping carrier webhook gateway configuration error.');
  });

  it('fails closed with 500 in production when carrier secret is placeholder (E-COM-062)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SHIPROCKET_WEBHOOK_SECRET', 'placeholder_sr_secret');

    const req = new Request('http://localhost:3000/api/webhooks/shipping/shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shiprocket-signature': 'some_signature'
      },
      body: JSON.stringify({
        awb: 'SR12345678',
        current_status: 'DELIVERED'
      })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'shiprocket' })
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Shipping carrier webhook gateway configuration error.');
  });

  it('accepts and processes valid authenticated webhook request', async () => {
    vi.stubEnv('SHIPROCKET_WEBHOOK_SECRET', 'valid_secure_secret_789');

    const req = new Request('http://localhost:3000/api/webhooks/shipping/shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shiprocket-signature': 'valid_secure_secret_789'
      },
      body: JSON.stringify({
        awb: 'SR12345678',
        current_status: 'IN_TRANSIT',
        current_timestamp: '2026-09-23T10:00:00Z',
        scans: [{ location: 'Hyderabad Hub', activity: 'Package in transit' }]
      })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'shiprocket' })
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.processed).toBe(true);
  });

  it('returns 400 when body payload lacks required tracking details', async () => {
    vi.stubEnv('SHIPROCKET_WEBHOOK_SECRET', 'valid_secure_secret_789');

    const req = new Request('http://localhost:3000/api/webhooks/shipping/shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shiprocket-signature': 'valid_secure_secret_789'
      },
      body: JSON.stringify({
        // Missing awb or awb_code
        current_status: 'IN_TRANSIT'
      })
    });

    const res = await handleShippingWebhook(req, {
      params: Promise.resolve({ provider: 'shiprocket' })
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
