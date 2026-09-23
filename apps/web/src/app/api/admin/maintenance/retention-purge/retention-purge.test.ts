import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';
import type { AdminRole } from '@hh/domain';

import * as adminAuthModule from '../../../../../lib/admin-auth';
import { POST as retentionPurgeRoute } from './route';

describe('Admin Retention Purge API Route (POST /api/admin/maintenance/retention-purge)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDb = {} as DatabaseClient;

  it('rejects unauthorized requests with 401 when no valid admin session exists', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/maintenance/retention-purge', {
      method: 'POST'
    });

    const res = await retentionPurgeRoute(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized.');
  });

  it('rejects forbidden requests with 403 when admin lacks governance/compliance permissions', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue({
      session: {
        id: 'sess-1',
        tokenHash: 'hash-1',
        adminId: 'admin-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      },
      admin: {
        id: 'admin-1',
        storeId: 'store-1',
        email: 'ops@brand.com',
        name: 'Ops Staff',
        role: 'customer' as unknown as AdminRole, // Missing super_admin or compliance role
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    const req = new Request('http://localhost:3000/api/admin/maintenance/retention-purge', {
      method: 'POST'
    });

    const res = await retentionPurgeRoute(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Forbidden');
  });

  it('executes retention purge and records immutable audit log for super_admin', async () => {
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

    const purgeSpy = vi.spyOn(dbModule, 'executeRetentionPurge').mockResolvedValue({
      purgedOtpsCount: 14,
      anonymizedOutboxEventsCount: 28,
      executedAt: new Date().toISOString()
    });

    const auditSpy = vi.spyOn(dbModule, 'recordAdminAuditLog').mockResolvedValue({
      id: 'audit-1',
      adminId: 'admin-123',
      adminEmail: 'admin@brand.com',
      action: 'compliance:retention_purged',
      entityType: 'retention_policy',
      entityId: 'admin-123',
      details: {},
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
      createdAt: new Date()
    });

    const req = new Request('http://localhost:3000/api/admin/maintenance/retention-purge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otpRetentionHours: 12, outboxRetentionDays: 14 })
    });

    const res = await retentionPurgeRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.purgedOtpsCount).toBe(14);
    expect(data.anonymizedOutboxEventsCount).toBe(28);

    expect(purgeSpy).toHaveBeenCalledWith(mockDb, {
      otpRetentionHours: 12,
      outboxRetentionDays: 14
    });
    expect(auditSpy).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        action: 'compliance:retention_purged',
        adminEmail: 'admin@brand.com'
      })
    );
  });
});
