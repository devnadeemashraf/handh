import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { Order, OrderItem, PaymentAttempt, Store } from '@hh/db';
import type { User } from '@hh/domain';

import * as adminAuthModule from '../../../../lib/admin-auth';
import * as authModule from '../../../../lib/auth';
import { generateOrderReceiptToken } from '../../../../lib/receipt-token';
import { POST as initPaymentOrder } from './route';

import type { AdminSessionContext } from '../../../../lib/admin-auth';

vi.mock('../../../../lib/auth', () => ({
  getCurrentUser: vi.fn()
}));

vi.mock('../../../../lib/admin-auth', () => ({
  getAdminSession: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findOrderById: vi.fn(),
  findPaymentAttemptsByOrderId: vi.fn(),
  findStoreBySlug: vi.fn(),
  createGatewayOrder: vi.fn(),
  createPaymentAttempt: vi.fn()
}));

describe('Payment Order Initialization Route (E-COM-045)', () => {
  const orderId = '11111111-2222-3333-4444-555555555555';
  const orderNumber = 'HH-2026-00042';
  const ownerUserId = 'user-owner-123';

  const mockOrder = {
    id: orderId,
    orderNumber,
    userId: ownerUserId,
    status: 'pending_payment',
    totalMinor: 49900,
    currency: 'INR',
    customerName: 'Zainab Ahmed',
    customerEmail: 'zainab@example.com',
    customerPhone: '+919876543210',
    items: []
  } as unknown as Order & { items: OrderItem[] };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(dbModule.findOrderById).mockResolvedValue(mockOrder);
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue({
      id: 'store-1',
      settings: {}
    } as unknown as Store);
    vi.mocked(dbModule.findPaymentAttemptsByOrderId).mockResolvedValue([]);
    vi.mocked(dbModule.createGatewayOrder).mockResolvedValue({
      id: 'order_rzp_mock_123',
      amountMinor: 49900,
      currency: 'INR',
      receipt: orderNumber,
      status: 'created'
    });
    vi.mocked(dbModule.createPaymentAttempt).mockResolvedValue({} as unknown as PaymentAttempt);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects invalid JSON payload with 400', async () => {
    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 'not-a-uuid' })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('returns 404 when order cannot be found', async () => {
    vi.mocked(dbModule.findOrderById).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated request without token with 403 Forbidden (E-COM-045)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('FORBIDDEN');
  });

  it('rejects authenticated request when order belongs to another user with 403 Forbidden (IDOR prevention)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: 'attacker-user-999',
      role: 'customer'
    } as unknown as User);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('FORBIDDEN');
  });

  it('authorizes authenticated user when they own the order and sanitizes customer PII from response (E-COM-045)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: ownerUserId,
      role: 'customer'
    } as unknown as User);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.razorpayOrderId).toBe('order_rzp_mock_123');
    expect(data.amountMinor).toBe(49900);
    expect(data.orderNumber).toBe(orderNumber);

    // CRITICAL: Ensure customer PII is NEVER broadcasted
    expect(data.customerName).toBeUndefined();
    expect(data.customerEmail).toBeUndefined();
    expect(data.customerPhone).toBeUndefined();
  });

  it('authorizes request when valid HMAC receipt token is provided in payload (E-COM-045)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    const validToken = generateOrderReceiptToken(orderId, orderNumber);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, token: validToken })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.razorpayOrderId).toBe('order_rzp_mock_123');
  });

  it('authorizes request when valid HMAC receipt token is provided in header (E-COM-045)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce(null);

    const validToken = generateOrderReceiptToken(orderId, orderNumber);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-order-token': validToken
      },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('authorizes administrator session', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce(null);
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValueOnce({
      admin: { id: 'admin-1', role: 'super_admin' }
    } as unknown as AdminSessionContext);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('reuses existing initiated payment attempt if matching attempt already exists (E-COM-045)', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: ownerUserId,
      role: 'customer'
    } as unknown as User);

    const existingAttempt = {
      id: 'attempt-1',
      orderId,
      provider: 'razorpay',
      providerOrderId: 'order_rzp_existing_reused',
      status: 'initiated',
      amountMinor: 49900,
      currency: 'INR'
    } as unknown as PaymentAttempt;

    vi.mocked(dbModule.findPaymentAttemptsByOrderId).mockResolvedValueOnce([existingAttempt]);

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.razorpayOrderId).toBe('order_rzp_existing_reused');

    // Razorpay create order should NOT be called since attempt was reused!
    expect(dbModule.createGatewayOrder).not.toHaveBeenCalled();
    expect(dbModule.createPaymentAttempt).not.toHaveBeenCalled();
  });

  it('rejects order when status is not pending_payment', async () => {
    vi.mocked(authModule.getCurrentUser).mockResolvedValueOnce({
      id: ownerUserId,
      role: 'customer'
    } as unknown as User);

    vi.mocked(dbModule.findOrderById).mockResolvedValueOnce({
      ...mockOrder,
      status: 'paid'
    } as unknown as Order & { items: OrderItem[] });

    const req = new Request('http://localhost:3000/api/checkout/payment-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const res = await initPaymentOrder(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toContain('Order is not pending payment');
  });
});
