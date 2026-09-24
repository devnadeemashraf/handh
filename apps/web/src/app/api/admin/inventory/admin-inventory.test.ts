import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';
import * as catalogCacheModule from '@/lib/catalog-cache';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import { POST as handleAdjustStock } from './adjust/route';
import { PATCH as handleUpdatePrice } from './price/route';
import { GET as handleListInventory } from './route';
import { PATCH as handleUpdateStatus } from './status/route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn(),
  getSharedDb: vi.fn().mockReturnValue({})
}));

vi.mock('@/lib/catalog-cache', () => ({
  invalidateCatalogCache: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  listAdminInventory: vi.fn(),
  listInventoryAuditLogs: vi.fn(),
  adjustStock: vi.fn(),
  updateVariantPrice: vi.fn(),
  updateProductStatus: vi.fn(),
  recordAdminAuditLog: vi.fn()
}));

describe('Admin Inventory API Routes', () => {
  const mockAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'admin-uuid-1',
      email: 'admin@handh.in',
      role: 'superadmin'
    }
  } as unknown as AdminSessionContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/inventory', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const response = await handleListInventory();
      expect(response.status).toBe(401);
    });

    it('returns inventory roster, summary metrics, and audit logs on success', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.listAdminInventory).mockResolvedValue({
        items: [
          {
            variantId: 'var-1',
            sku: 'HH-ACC-NP-04',
            productTitle: 'Vintage Filigree',
            variantTitle: 'Brass',
            priceMinor: 59900,
            onHand: 20,
            reserved: 2,
            available: 18,
            status: 'published'
          }
        ],
        summary: {
          totalProducts: 1,
          totalVariants: 1,
          totalOnHand: 20,
          totalReserved: 2,
          totalAvailable: 18,
          outOfStockVariants: 0
        }
      } as unknown as Awaited<ReturnType<typeof dbModule.listAdminInventory>>);
      vi.mocked(dbModule.listInventoryAuditLogs).mockResolvedValue([]);

      const response = await handleListInventory();
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.items).toHaveLength(1);
      expect(body.summary.totalAvailable).toBe(18);
    });
  });

  describe('POST /api/admin/inventory/adjust', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: '11111111-2222-3333-4444-555555555555',
          delta: 5,
          reason: 'Restock'
        })
      });

      const response = await handleAdjustStock(request);
      expect(response.status).toBe(401);
    });

    it('returns 400 on invalid adjustment payload', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);

      const request = new Request('http://localhost:3000/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: 'not-a-uuid', delta: 'five' })
      });

      const response = await handleAdjustStock(request);
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Validation failed.');
    });

    it('adjusts stock and creates audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.adjustStock).mockResolvedValue({
        level: {
          id: 'inv-1',
          variantId: '11111111-2222-3333-4444-555555555555',
          onHand: 25,
          reserved: 0
        },
        auditLog: {
          id: 'log-1',
          delta: 5,
          reason: 'manual_restock'
        }
      } as unknown as Awaited<ReturnType<typeof dbModule.adjustStock>>);

      const request = new Request('http://localhost:3000/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: '11111111-2222-3333-4444-555555555555',
          delta: 5,
          reason: 'manual_restock'
        })
      });

      const response = await handleAdjustStock(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.level.onHand).toBe(25);
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'inventory:stock_adjusted',
          entityType: 'inventory_level',
          entityId: '11111111-2222-3333-4444-555555555555'
        })
      );
      expect(catalogCacheModule.invalidateCatalogCache).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/admin/inventory/price', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/inventory/price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: '11111111-2222-3333-4444-555555555555',
          priceMinor: 69900
        })
      });

      const response = await handleUpdatePrice(request);
      expect(response.status).toBe(401);
    });

    it('updates variant price and writes audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateVariantPrice).mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof dbModule.updateVariantPrice>>
      );

      const request = new Request('http://localhost:3000/api/admin/inventory/price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: '11111111-2222-3333-4444-555555555555',
          priceMinor: 69900
        })
      });

      const response = await handleUpdatePrice(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(dbModule.updateVariantPrice).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variantId: '11111111-2222-3333-4444-555555555555',
          priceMinor: 69900
        })
      );
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'inventory:price_updated',
          entityType: 'product_variant',
          entityId: '11111111-2222-3333-4444-555555555555'
        })
      );
      expect(catalogCacheModule.invalidateCatalogCache).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/admin/inventory/status', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/admin/inventory/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: '11111111-2222-3333-4444-555555555555',
          status: 'archived'
        })
      });

      const response = await handleUpdateStatus(request);
      expect(response.status).toBe(401);
    });

    it('updates product lifecycle status and writes audit log on valid submission', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateProductStatus).mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof dbModule.updateProductStatus>>
      );

      const request = new Request('http://localhost:3000/api/admin/inventory/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: '11111111-2222-3333-4444-555555555555',
          status: 'published'
        })
      });

      const response = await handleUpdateStatus(request);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(dbModule.updateProductStatus).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          productId: '11111111-2222-3333-4444-555555555555',
          status: 'published'
        })
      );
      expect(catalogCacheModule.invalidateCatalogCache).toHaveBeenCalled();
    });
  });
});
