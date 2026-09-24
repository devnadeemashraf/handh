import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';
import type { AdminRole } from '@hh/domain';

import * as adminAuthModule from '../../../../lib/admin-auth';
import { GET as auditLogsRoute } from './route';

describe('Admin Audit Logs API Route (GET /api/admin/audit-logs)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockDb = {} as DatabaseClient;

  it('rejects unauthorized requests with 401 when no admin session exists', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/audit-logs');
    const res = await auditLogsRoute(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized.');
  });

  it('returns paginated audit logs for authenticated administrator', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue({
      session: {
        id: 'sess-1',
        tokenHash: 'hash-1',
        adminId: 'admin-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      },
      admin: {
        id: 'admin-1',
        storeId: 'store-1',
        email: 'admin@brand.com',
        name: 'Admin User',
        role: 'super_admin' as AdminRole,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    vi.spyOn(adminAuthModule, 'getSharedDb').mockReturnValue(mockDb);

    const mockLogs = [
      {
        id: 'log-1',
        adminId: 'admin-1',
        adminEmail: 'admin@brand.com',
        action: 'settings:service_control_updated',
        entityType: 'store_settings',
        entityId: 'hh',
        details: { changes: { maintenanceMode: true } },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date().toISOString()
      }
    ];

    vi.spyOn(dbModule, 'listAdminAuditLogs').mockResolvedValue(mockLogs);
    vi.spyOn(dbModule, 'countAdminAuditLogs').mockResolvedValue(1);

    const req = new Request(
      'http://localhost:3000/api/admin/audit-logs?action=settings:service_control_updated&limit=25&offset=0'
    );
    const res = await auditLogsRoute(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.logs).toHaveLength(1);
    expect(data.logs[0].action).toBe('settings:service_control_updated');
    expect(data.total).toBe(1);
    expect(data.limit).toBe(25);
    expect(data.offset).toBe(0);
  });

  it('rejects invalid query parameters with 400', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue({
      session: {
        id: 'sess-1',
        tokenHash: 'hash-1',
        adminId: 'admin-1',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date()
      },
      admin: {
        id: 'admin-1',
        storeId: 'store-1',
        email: 'admin@brand.com',
        name: 'Admin User',
        role: 'admin' as AdminRole,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    const req = new Request('http://localhost:3000/api/admin/audit-logs?limit=-5');
    const res = await auditLogsRoute(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed.');
  });
});
