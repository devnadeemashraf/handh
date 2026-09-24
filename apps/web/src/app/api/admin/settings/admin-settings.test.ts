import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';
import * as catalogCacheModule from '@/lib/catalog-cache';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { Store } from '@hh/db';
import type { InvoiceTemplateConfig, StorefrontConfig } from '@hh/domain';

import { GET as handleGetBrand, PATCH as handlePatchBrand } from './brand/route';
import { GET as handleGetInvoice, PATCH as handlePatchInvoice } from './invoice/route';
import {
  GET as handleGetServiceControl,
  PATCH as handlePatchServiceControl
} from './service-control/route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn(),
  getSharedDb: vi.fn().mockReturnValue({})
}));

vi.mock('@/lib/catalog-cache', () => ({
  invalidateCatalogCache: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findStoreBySlug: vi.fn(),
  updateStoreInvoiceSettings: vi.fn(),
  getStoreServiceControl: vi.fn(),
  updateStoreServiceControl: vi.fn(),
  getStorefrontConfig: vi.fn(),
  updateStorefrontConfig: vi.fn(),
  recordAdminAuditLog: vi.fn()
}));

describe('Admin Store Settings API Routes', () => {
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

  describe('Invoice Settings (/api/admin/settings/invoice)', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const res = await handleGetInvoice();
      expect(res.status).toBe(401);
    });

    it('returns resolved invoice template on GET', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.findStoreBySlug).mockResolvedValue({
        id: 'store-1',
        settings: { invoice: { companyName: 'H&H Luxury' } }
      } as unknown as Store);

      const res = await handleGetInvoice();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.template).toBeDefined();
    });

    it('updates invoice settings on valid PATCH', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateStoreInvoiceSettings).mockResolvedValue({
        companyName: 'H&H Luxury Modest Wear'
      } as unknown as InvoiceTemplateConfig);

      const request = new Request('http://localhost:3000/api/admin/settings/invoice', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: 'H&H Luxury Modest Wear' })
      });

      const res = await handlePatchInvoice(request);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'settings:invoice_updated'
        })
      );
    });
  });

  describe('Service Control Settings (/api/admin/settings/service-control)', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const res = await handleGetServiceControl();
      expect(res.status).toBe(401);
    });

    it('returns service control config on GET', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.getStoreServiceControl).mockResolvedValue({
        operatingStatus: 'active',
        checkoutEnabled: true,
        paymentsEnabled: true,
        headline: 'Welcome',
        maintenanceNotice: 'Operating normally'
      });

      const res = await handleGetServiceControl();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.serviceControl.operatingStatus).toBe('active');
    });

    it('updates service control on valid PATCH', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateStoreServiceControl).mockResolvedValue({
        operatingStatus: 'maintenance',
        checkoutEnabled: false,
        paymentsEnabled: false,
        headline: 'Scheduled server maintenance in progress',
        maintenanceNotice: 'Scheduled server maintenance in progress'
      });

      const request = new Request('http://localhost:3000/api/admin/settings/service-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatingStatus: 'maintenance',
          checkoutEnabled: false
        })
      });

      const res = await handlePatchServiceControl(request);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.serviceControl.operatingStatus).toBe('maintenance');
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'settings:service_control_updated'
        })
      );
      expect(catalogCacheModule.invalidateCatalogCache).toHaveBeenCalled();
    });
  });

  describe('Brand Storefront Settings (/api/admin/settings/brand)', () => {
    it('returns 401 when unauthorized', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

      const res = await handleGetBrand();
      expect(res.status).toBe(401);
    });

    it('returns brand configuration on GET', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.getStorefrontConfig).mockResolvedValue({
        brandName: 'H&H',
        tagline: 'Artisanal Luxury'
      } as unknown as StorefrontConfig);

      const res = await handleGetBrand();
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.config.brandName).toBe('H&H');
    });

    it('updates brand storefront config on valid PATCH', async () => {
      vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
      vi.mocked(dbModule.updateStorefrontConfig).mockResolvedValue({
        brandName: 'H&H Luxury',
        tagline: 'Refined Artisanal Essentials'
      } as unknown as StorefrontConfig);

      const request = new Request('http://localhost:3000/api/admin/settings/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: 'H&H Luxury' })
      });

      const res = await handlePatchBrand(request);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(dbModule.recordAdminAuditLog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'settings:brand_updated'
        })
      );
      expect(catalogCacheModule.invalidateCatalogCache).toHaveBeenCalled();
    });
  });
});
