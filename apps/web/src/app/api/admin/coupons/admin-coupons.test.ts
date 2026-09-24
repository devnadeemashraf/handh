import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { Coupon } from '@hh/domain';

import { PATCH as handleUpdateCoupon } from './[id]/route';
import { GET as handleListCoupons, POST as handleCreateCoupon } from './route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn(),
  getSharedDb: vi.fn().mockReturnValue({})
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  listCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  recordAdminAuditLog: vi.fn()
}));

describe('Admin Coupons API Routes', () => {
  const mockAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'admin-uuid-1',
      email: 'admin@handh.in',
      role: 'superadmin'
    }
  } as unknown as AdminSessionContext;

  const sampleCoupon: Coupon = {
    id: 'coupon-uuid-1',
    code: 'FESTIVE25',
    discountType: 'percentage',
    value: 25,
    minOrderValueMinor: 100000,
    maxDiscountMinor: 50000,
    usageLimit: 200,
    timesUsed: 12,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/coupons', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const response = await handleListCoupons();
      expect(response.status).toBe(401);
    });

    it('returns list of coupons on success', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.listCoupons).mockResolvedValue([sampleCoupon]);

      const response = await handleListCoupons();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.coupons).toHaveLength(1);
      expect(body.coupons[0].code).toBe('FESTIVE25');
    });
  });

  describe('POST /api/admin/coupons', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'INVALID' })
      });

      const response = await handleCreateCoupon(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 on invalid coupon validation schema', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);

      const request = new Request('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '', // Invalid empty code
          discountType: 'percentage',
          value: 150 // Percentage > 100 invalid
        })
      });

      const response = await handleCreateCoupon(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed');
    });

    it('creates coupon and writes audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.createCoupon).mockResolvedValue(sampleCoupon);

      const request = new Request('http://localhost:3000/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'FESTIVE25',
          discountType: 'percentage',
          value: 25,
          minOrderMinor: 100000,
          maxDiscountMinor: 50000,
          usageLimit: 200,
          isActive: true
        })
      });

      const response = await handleCreateCoupon(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.coupon.code).toBe('FESTIVE25');
      expect(dbModule.createCoupon).toHaveBeenCalledWith(
        expect.anything(),
        'hh',
        expect.objectContaining({
          code: 'FESTIVE25',
          discountType: 'percentage',
          value: 25
        })
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'coupon:created',
          entityType: 'coupon',
          entityId: 'coupon-uuid-1'
        })
      );
    });
  });

  describe('PATCH /api/admin/coupons/[id]', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/coupons/coupon-uuid-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });

      const response = await handleUpdateCoupon(request, {
        params: Promise.resolve({ id: 'coupon-uuid-1' })
      });
      expect(response.status).toBe(401);
    });

    it('updates coupon and writes audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateCoupon).mockResolvedValue({
        ...sampleCoupon,
        isActive: false
      });

      const request = new Request('http://localhost:3000/api/admin/coupons/coupon-uuid-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false })
      });

      const response = await handleUpdateCoupon(request, {
        params: Promise.resolve({ id: 'coupon-uuid-1' })
      });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.coupon.isActive).toBe(false);
      expect(dbModule.updateCoupon).toHaveBeenCalledWith(
        expect.anything(),
        'hh',
        'coupon-uuid-1',
        expect.objectContaining({ isActive: false })
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'coupon:updated',
          entityType: 'coupon',
          entityId: 'coupon-uuid-1'
        })
      );
    });
  });
});
