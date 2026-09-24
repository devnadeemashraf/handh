import { afterEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { POST as returnReceiveRoute } from './route';

describe('Admin Fulfillment Return Intake API Route (POST /api/admin/fulfillments/[id]/return-receive)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDb = {} as DatabaseClient;

  it('rejects unauthorized requests with 401 when no valid admin session exists', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/fulfillments/fulf-1/return-receive', {
      method: 'POST'
    });

    const res = await returnReceiveRoute(req, {
      params: Promise.resolve({ id: 'fulf-1' })
    });
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized.');
  });

  it('successfully processes return intake and restocks inventory when authenticated', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue({
      session: {
        id: 'sess-123',
        tokenHash: 'hash-123',
        adminId: 'admin-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      },
      admin: {
        id: 'admin-123',
        storeId: 'store-123',
        email: 'admin@brand.com',
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    vi.spyOn(dbModule, 'getSharedDbClient').mockReturnValue(mockDb);
    const auditSpy = vi.spyOn(dbModule, 'recordAdminAuditLog').mockResolvedValue({
      id: 'audit-1',
      adminId: 'admin-123',
      adminEmail: 'admin@brand.com',
      action: 'fulfillment:return_received',
      entityType: 'fulfillment',
      entityId: 'fulf-1',
      details: {},
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    });

    const receiveSpy = vi.spyOn(dbModule, 'receiveFulfillmentReturn').mockResolvedValue({
      success: true,
      fulfillmentId: 'fulf-1',
      orderId: 'ord-123',
      restockedItems: [
        {
          variantId: 'var-1',
          sku: 'SKU-001',
          productTitle: 'Silver Clip',
          quantity: 2
        }
      ]
    });

    const req = new Request('http://localhost:3000/api/admin/fulfillments/fulf-1/return-receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: 'Customer returned package - verified seal intact',
        restock: true
      })
    });

    const res = await returnReceiveRoute(req, {
      params: Promise.resolve({ id: 'fulf-1' })
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(receiveSpy).toHaveBeenCalledWith(mockDb, {
      fulfillmentId: 'fulf-1',
      note: 'Customer returned package - verified seal intact',
      restock: true
    });
    expect(auditSpy).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        adminId: 'admin-123',
        action: 'fulfillment:return_received',
        entityType: 'fulfillment',
        entityId: 'fulf-1'
      })
    );
    expect(data.success).toBe(true);
    expect(data.result.restockedItems.length).toBe(1);
    expect(receiveSpy).toHaveBeenCalledWith(mockDb, {
      fulfillmentId: 'fulf-1',
      note: 'Customer returned package - verified seal intact',
      restock: true
    });
  });

  it('returns 400 when fulfillment return intake fails or was already returned', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue({
      session: {
        id: 'sess-123',
        tokenHash: 'hash-123',
        adminId: 'admin-123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      },
      admin: {
        id: 'admin-123',
        storeId: 'store-123',
        email: 'admin@brand.com',
        name: 'Super Admin',
        role: 'super_admin',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    vi.spyOn(dbModule, 'getSharedDbClient').mockReturnValue(mockDb);

    vi.spyOn(dbModule, 'receiveFulfillmentReturn').mockRejectedValue(
      new Error("Fulfillment 'TRK-2026-ABCDE' has already been marked as returned and restocked.")
    );

    const req = new Request('http://localhost:3000/api/admin/fulfillments/fulf-1/return-receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await returnReceiveRoute(req, {
      params: Promise.resolve({ id: 'fulf-1' })
    });
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('already been marked as returned and restocked');
  });
});
