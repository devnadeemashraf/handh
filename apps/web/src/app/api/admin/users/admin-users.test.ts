import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { User } from '@hh/domain';

import { PATCH as handleUpdateUserRole } from './[id]/role/route';
import { GET as handleListUsers } from './route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn(),
  getSharedDb: vi.fn().mockReturnValue({})
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  listUsers: vi.fn(),
  updateUserRole: vi.fn(),
  recordAdminAuditLog: vi.fn()
}));

describe('Admin Users Management API Routes', () => {
  const superAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'super-admin-uuid',
      email: 'owner@handh.in',
      role: 'super_admin'
    }
  } as unknown as AdminSessionContext;

  const supportAdminContext = {
    session: { id: 'sess-2' },
    admin: {
      id: 'support-admin-uuid',
      email: 'support@handh.in',
      role: 'support'
    }
  } as unknown as AdminSessionContext;

  const mockUsers: User[] = [
    {
      id: 'user-uuid-1',
      storeId: 'hh',
      phone: '+919876543210',
      phoneVerified: true,
      emailVerified: false,
      role: 'customer',
      whatsappOptIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const res = await handleListUsers();
      expect(res.status).toBe(401);
    });

    it('returns users list when authorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(superAdminContext);
      vi.mocked(dbModule.listUsers).mockResolvedValue(mockUsers);

      const res = await handleListUsers();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.users).toHaveLength(1);
    });
  });

  describe('PATCH /api/admin/users/[id]/role', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });

      const res = await handleUpdateUserRole(request, {
        params: Promise.resolve({ id: 'user-1' })
      });
      expect(res.status).toBe(401);
    });

    it('returns 403 when non-super_admin attempts role modification', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(supportAdminContext);

      const request = new Request('http://localhost:3000/api/admin/users/user-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });

      const res = await handleUpdateUserRole(request, {
        params: Promise.resolve({ id: 'user-1' })
      });
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body.error).toContain('Only super administrators');
    });

    it('returns 400 when admin attempts self-role modification', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(superAdminContext);

      const request = new Request('http://localhost:3000/api/admin/users/super-admin-uuid/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'customer' })
      });

      const res = await handleUpdateUserRole(request, {
        params: Promise.resolve({ id: 'super-admin-uuid' })
      });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain('Self-modification');
    });

    it('updates role and records audit log when super_admin promotes user', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(superAdminContext);
      vi.mocked(dbModule.updateUserRole).mockResolvedValue({
        ...mockUsers[0],
        role: 'admin'
      } as User);

      const request = new Request('http://localhost:3000/api/admin/users/user-uuid-1/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });

      const res = await handleUpdateUserRole(request, {
        params: Promise.resolve({ id: 'user-uuid-1' })
      });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.user.role).toBe('admin');
      expect(dbModule.updateUserRole).toHaveBeenCalledWith(
        expect.anything(),
        'user-uuid-1',
        'admin'
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          adminId: 'super-admin-uuid',
          action: 'user:role_updated',
          entityType: 'user',
          entityId: 'user-uuid-1',
          details: { newRole: 'admin' }
        })
      );
    });
  });
});
