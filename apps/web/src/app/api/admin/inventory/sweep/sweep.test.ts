import { afterEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { POST as sweepInventoryRoute } from './route';

describe('Admin Inventory Sweep API Route (POST /api/admin/inventory/sweep)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDb = {} as DatabaseClient;

  it('rejects unauthorized requests with 401 when no valid admin session exists', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/inventory/sweep', {
      method: 'POST'
    });

    const res = await sweepInventoryRoute(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized.');
  });

  it('successfully triggers sweep and records audit log when authenticated as admin', async () => {
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

    vi.spyOn(adminAuthModule, 'getSharedDb').mockReturnValue(mockDb);

    const sweepSpy = vi.spyOn(dbModule, 'sweepExpiredReservations').mockResolvedValue({
      releasedReservationsCount: 3,
      affectedVariantsCount: 2,
      cancelledOrdersCount: 1,
      orderIds: ['order-abc-123']
    });

    const auditSpy = vi.spyOn(dbModule, 'recordAdminAuditLog').mockResolvedValue({
      id: 'audit-1',
      adminId: 'admin-123',
      adminEmail: 'admin@brand.com',
      action: 'inventory:reservations_swept',
      entityType: 'inventory_reservation',
      entityId: 'admin-123',
      details: {},
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    });

    const req = new Request('http://localhost:3000/api/admin/inventory/sweep', {
      method: 'POST',
      headers: {
        'x-real-ip': '203.0.113.195',
        'user-agent': 'Admin-Client/1.0'
      }
    });

    const res = await sweepInventoryRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.releasedReservationsCount).toBe(3);
    expect(data.affectedVariantsCount).toBe(2);
    expect(data.cancelledOrdersCount).toBe(1);
    expect(data.orderIds).toEqual(['order-abc-123']);

    expect(sweepSpy).toHaveBeenCalledWith(mockDb);
    expect(auditSpy).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        adminId: 'admin-123',
        adminEmail: 'admin@brand.com',
        action: 'inventory:reservations_swept',
        ipAddress: '203.0.113.195',
        userAgent: 'Admin-Client/1.0',
        details: {
          releasedReservationsCount: 3,
          affectedVariantsCount: 2,
          cancelledOrdersCount: 1,
          orderIds: ['order-abc-123']
        }
      })
    );
  });

  it('returns 500 when database error occurs during sweeping', async () => {
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

    vi.spyOn(adminAuthModule, 'getSharedDb').mockReturnValue(mockDb);
    vi.spyOn(dbModule, 'sweepExpiredReservations').mockRejectedValue(
      new Error('Deadlock detected during sweep')
    );

    const req = new Request('http://localhost:3000/api/admin/inventory/sweep', {
      method: 'POST'
    });

    const res = await sweepInventoryRoute(req);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Deadlock detected during sweep');
  });
});
