import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { Fulfillment, Order } from '@hh/db';

import { POST as handleFulfillOrder } from './[id]/fulfill/route';
import { PATCH as handleUpdateOrderStatus } from './[id]/status/route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn(),
  getSharedDb: vi.fn().mockReturnValue({})
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  createOrderFulfillment: vi.fn(),
  transitionOrderStatus: vi.fn(),
  recordAdminAuditLog: vi.fn()
}));

vi.mock('@/lib/shipping', () => ({
  getShippingRegistry: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({
      providerId: 'manual',
      registerCounterAwb: vi.fn().mockResolvedValue(undefined)
    })
  })
}));

describe('Admin Orders Management API Routes', () => {
  const mockAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'admin-uuid-1',
      email: 'admin@handh.in',
      role: 'superadmin'
    }
  } as unknown as AdminSessionContext;

  const validOrderId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  const mockOrder = {
    id: validOrderId,
    orderNumber: 'HH-2026-00042',
    status: 'processing'
  } as Order;

  const mockFulfillment = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    orderId: validOrderId,
    trackingNumber: 'DEL123456789IN',
    courierProvider: 'dtdc',
    shippingProviderId: 'manual'
  } as Fulfillment;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/orders/[id]/fulfill', () => {
    it('returns 401 Unauthorized when session is absent', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request(
        `http://localhost:3000/api/admin/orders/${validOrderId}/fulfill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courierProvider: 'dtdc', trackingNumber: '123' })
        }
      );

      const response = await handleFulfillOrder(request, {
        params: Promise.resolve({ id: validOrderId })
      });
      expect(response.status).toBe(401);
    });

    it('returns 400 when fulfillment schema validation fails', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);

      const request = new Request(
        `http://localhost:3000/api/admin/orders/${validOrderId}/fulfill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierProvider: '', // Invalid empty provider
            trackingNumber: ''
          })
        }
      );

      const response = await handleFulfillOrder(request, {
        params: Promise.resolve({ id: validOrderId })
      });
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed.');
    });

    it('creates fulfillment and writes immutable audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.createOrderFulfillment).mockResolvedValue({
        fulfillment: mockFulfillment,
        order: { ...mockOrder, status: 'processing' }
      });

      const request = new Request(
        `http://localhost:3000/api/admin/orders/${validOrderId}/fulfill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierProvider: 'dtdc',
            trackingNumber: 'DTDC987654321',
            notes: 'Handed over to DTDC courier hub'
          })
        }
      );

      const response = await handleFulfillOrder(request, {
        params: Promise.resolve({ id: validOrderId })
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.fulfillment.trackingNumber).toBe('DEL123456789IN');
      expect(dbModule.createOrderFulfillment).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          orderId: validOrderId,
          courierProvider: 'dtdc',
          trackingNumber: 'DTDC987654321'
        })
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-uuid-1',
          action: 'order:fulfillment_created',
          entityType: 'order',
          entityId: validOrderId
        })
      );
    });
  });

  describe('PATCH /api/admin/orders/[id]/status', () => {
    it('returns 401 Unauthorized when session is absent', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/orders/order-uuid-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' })
      });

      const response = await handleUpdateOrderStatus(request, {
        params: Promise.resolve({ id: 'order-uuid-1' })
      });
      expect(response.status).toBe(401);
    });

    it('returns 400 when status is missing in payload', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);

      const request = new Request('http://localhost:3000/api/admin/orders/order-uuid-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const response = await handleUpdateOrderStatus(request, {
        params: Promise.resolve({ id: 'order-uuid-1' })
      });
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Target status is required');
    });

    it('transitions order status and records audit trail on valid request', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.transitionOrderStatus).mockResolvedValue({
        ...mockOrder,
        status: 'cancelled'
      });

      const request = new Request('http://localhost:3000/api/admin/orders/order-uuid-1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      const response = await handleUpdateOrderStatus(request, {
        params: Promise.resolve({ id: 'order-uuid-1' })
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.order.status).toBe('cancelled');
      expect(dbModule.transitionOrderStatus).toHaveBeenCalledWith(
        expect.anything(),
        'order-uuid-1',
        'cancelled'
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'admin-uuid-1',
          action: 'order:status_updated',
          entityType: 'order',
          entityId: 'order-uuid-1',
          details: { newStatus: 'cancelled' }
        })
      );
    });
  });
});
