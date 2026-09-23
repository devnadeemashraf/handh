import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { Store } from '@hh/db';
import type { User } from '@hh/domain';

import * as authModule from '../../../../lib/auth';
import { POST as handleSubmitOrder } from './route';

vi.mock('../../../../lib/auth', () => ({
  getCurrentUser: vi.fn()
}));

vi.mock('../../../../lib/rate-limit', () => ({
  checkoutSubmitRateLimiter: {
    limit: vi.fn().mockResolvedValue({ success: true, reset: 0 })
  }
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findStoreBySlug: vi.fn(),
  createPendingCheckoutOrder: vi.fn()
}));

describe('Checkout Submit API Route (E-COM-063)', () => {
  const validSubmission = {
    items: [
      {
        variantId: '11111111-2222-3333-4444-555555555555',
        quantity: 1
      }
    ],
    shippingAddress: {
      fullName: 'Fatima Begum',
      phone: '+919876543210',
      email: 'fatima@example.com',
      line1: 'Road No 36, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'IN' as const
    },
    idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue({
      id: 'store-1',
      settings: {}
    } as unknown as Store);

    vi.mocked(authModule.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      phone: '+919876543210'
    } as unknown as User);

    vi.mocked(dbModule.createPendingCheckoutOrder).mockResolvedValue({
      orderId: '00000000-0000-0000-0000-000000000001',
      orderNumber: 'HH-2026-00001',
      subtotalMinor: 499900,
      shippingMinor: 0,
      totalMinor: 499900,
      currency: 'INR',
      expiresAt: new Date(Date.now() + 900000).toISOString()
    });
  });

  it('rejects invalid submission with 400 VALIDATION_ERROR', async () => {
    const req = new Request('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }) // Empty items
    });

    const res = await handleSubmitOrder(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unserviceable PIN codes with 422 UNSERVICEABLE_PINCODE and never reserves stock (E-COM-063)', async () => {
    const unserviceableSubmission = {
      ...validSubmission,
      shippingAddress: {
        ...validSubmission.shippingAddress,
        postalCode: '790001' // Remote unserviceable pincode
      }
    };

    const req = new Request('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unserviceableSubmission)
    });

    const res = await handleSubmitOrder(req);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNSERVICEABLE_PINCODE');
    expect(data.error).toContain('Delivery is currently not available to PIN 790001');

    // Crucial: ensure no database order or stock hold was created
    expect(dbModule.createPendingCheckoutOrder).not.toHaveBeenCalled();
  });

  it('rejects military APS PIN codes with 422 UNSERVICEABLE_PINCODE (E-COM-063)', async () => {
    const apsSubmission = {
      ...validSubmission,
      shippingAddress: {
        ...validSubmission.shippingAddress,
        postalCode: '900001'
      }
    };

    const req = new Request('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apsSubmission)
    });

    const res = await handleSubmitOrder(req);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.code).toBe('UNSERVICEABLE_PINCODE');
    expect(dbModule.createPendingCheckoutOrder).not.toHaveBeenCalled();
  });

  it('requires authentication and returns 401 AUTH_REQUIRED', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission)
    });

    const res = await handleSubmitOrder(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.code).toBe('AUTH_REQUIRED');
    expect(dbModule.createPendingCheckoutOrder).not.toHaveBeenCalled();
  });

  it('successfully creates pending order and attaches receiptToken for serviceable PIN code (E-COM-063)', async () => {
    const req = new Request('http://localhost:3000/api/checkout/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validSubmission)
    });

    const res = await handleSubmitOrder(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.order.orderId).toBe('00000000-0000-0000-0000-000000000001');
    expect(data.order.receiptToken).toBeDefined();
    expect(typeof data.order.receiptToken).toBe('string');
    expect(dbModule.createPendingCheckoutOrder).toHaveBeenCalled();
  });
});
