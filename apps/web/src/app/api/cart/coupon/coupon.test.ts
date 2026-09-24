import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import { POST } from './route';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findCouponByCode: vi.fn()
}));

describe('Coupon Validation API Route (POST /api/cart/coupon)', () => {
  const activePercentageCoupon = {
    id: 'coupon-perc-1',
    code: 'WELCOME10',
    discountType: 'percentage' as const,
    value: 10,
    minOrderValueMinor: 50000,
    maxDiscountMinor: 20000,
    usageLimit: 100,
    timesUsed: 5,
    startsAt: new Date(Date.now() - 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isActive: true,
    createdAt: new Date().toISOString()
  };

  const activeFixedCoupon = {
    id: 'coupon-fixed-1',
    code: 'SAVE100',
    discountType: 'fixed' as const,
    value: 10000,
    minOrderValueMinor: 60000,
    maxDiscountMinor: null,
    usageLimit: null,
    timesUsed: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing or malformed request parameters with 400', async () => {
    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: '' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.valid).toBe(false);
    expect(data.reason).toContain('Invalid coupon verification request');
  });

  it('rejects negative subtotalMinor with 400', async () => {
    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', subtotalMinor: -500 })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.valid).toBe(false);
  });

  it('returns valid: false when coupon does not exist in store', async () => {
    vi.mocked(dbModule.findCouponByCode).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'DOESNOTEXIST', subtotalMinor: 100000 })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.valid).toBe(false);
    expect(data.reason).toMatch(/Invalid or (unrecognized|expired)/i);
  });

  it('returns valid: false when subtotal does not reach minimum order threshold', async () => {
    vi.mocked(dbModule.findCouponByCode).mockResolvedValue(activePercentageCoupon);

    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', subtotalMinor: 40000 }) // 400 INR < 500 INR required
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.valid).toBe(false);
    expect(data.reason).toMatch(/Minimum order value/i);
  });

  it('correctly applies percentage coupon with max discount boundary', async () => {
    vi.mocked(dbModule.findCouponByCode).mockResolvedValue(activePercentageCoupon);

    // subtotal = 1000 INR (100,000 minor). 10% of 100,000 = 10,000 minor (100 INR). Under 200 INR cap.
    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', subtotalMinor: 100000 })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.valid).toBe(true);
    expect(data.coupon.code).toBe('WELCOME10');
    expect(data.discountMinor).toBe(10000);
    expect(data.newSubtotalMinor).toBe(90000);
  });

  it('correctly applies fixed discount coupon', async () => {
    vi.mocked(dbModule.findCouponByCode).mockResolvedValue(activeFixedCoupon);

    // subtotal = 800 INR (80,000 minor). Fixed discount 100 INR (10,000 minor). New = 70,000 minor.
    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE100', subtotalMinor: 80000 })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.valid).toBe(true);
    expect(data.discountMinor).toBe(10000);
    expect(data.newSubtotalMinor).toBe(70000);
  });

  it('handles database lookup errors with 500 status', async () => {
    vi.mocked(dbModule.findCouponByCode).mockRejectedValue(new Error('DB read timeout'));

    const request = new Request('http://localhost:3000/api/cart/coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME10', subtotalMinor: 100000 })
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.valid).toBe(false);
    expect(data.reason).toBe('DB read timeout');
  });
});
