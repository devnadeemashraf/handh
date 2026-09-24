import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';
import * as shippingModule from '@/lib/shipping';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { POST as bookPickupRoute } from './route';

describe('Admin Book Doorstep Pickup API Route (POST /api/admin/orders/[id]/book-pickup)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env['WAREHOUSE_NAME'] = 'Hyderabad Central Studio';
    process.env['WAREHOUSE_PHONE'] = '+919988776655';
    process.env['WAREHOUSE_LINE1'] = 'Road No 36, Jubilee Hills';
    process.env['WAREHOUSE_CITY'] = 'Hyderabad';
    process.env['WAREHOUSE_STATE'] = 'Telangana';
    process.env['WAREHOUSE_POSTAL_CODE'] = '500033';
    process.env['WAREHOUSE_COUNTRY'] = 'India';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  const mockDb = {} as DatabaseClient;

  const mockOrder = {
    id: 'ord-123',
    orderNumber: 'HH-2026-00123',
    status: 'paid',
    customerName: 'Aarav Sharma',
    customerPhone: '+919876543210',
    customerEmail: 'aarav@example.com',
    totalMinor: 499900,
    shippingAddress: {
      line1: 'Flat 101, Palm Grove',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India'
    }
  };

  it('rejects unauthorized requests with 401 when no valid admin session exists', async () => {
    vi.spyOn(adminAuthModule, 'getAdminSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/admin/orders/ord-123/book-pickup', {
      method: 'POST'
    });

    const res = await bookPickupRoute(req, {
      params: Promise.resolve({ id: 'ord-123' })
    });
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('uses validated warehouse origin from environment variables when booking pickup (E-COM-067)', async () => {
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
    // @ts-expect-error Mock order return
    vi.spyOn(dbModule, 'findOrderById').mockResolvedValue(mockOrder);

    const bookDoorstepPickupMock = vi.fn().mockResolvedValue({
      awb: 'DEL12345678',
      courierName: 'Delhivery Direct',
      labelUrl: 'https://delhivery.com/label.pdf',
      pickupToken: 'TOKEN-99'
    });

    const mockAdapter = {
      name: 'Delhivery Direct Express',
      supportsDoorstepPickup: true,
      bookDoorstepPickup: bookDoorstepPickupMock
    };

    // @ts-expect-error Mock registry
    vi.spyOn(shippingModule, 'getShippingRegistry').mockReturnValue({
      getOrThrow: vi.fn().mockReturnValue(mockAdapter)
    });

    vi.spyOn(dbModule, 'createOrderFulfillment').mockResolvedValue({
      // @ts-expect-error Mock fulfillment
      fulfillment: { id: 'fulf-1', trackingNumber: 'DEL12345678' },
      // @ts-expect-error Mock order
      order: mockOrder
    });

    const req = new Request('http://localhost:3000/api/admin/orders/ord-123/book-pickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'delhivery',
        weightGrams: 350
      })
    });

    const res = await bookPickupRoute(req, {
      params: Promise.resolve({ id: 'ord-123' })
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify bookDoorstepPickup received origin from environment variables
    expect(bookDoorstepPickupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord-123',
        origin: {
          name: 'Hyderabad Central Studio',
          phone: '+919988776655',
          line1: 'Road No 36, Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'India'
        }
      })
    );
  });

  it('allows overriding warehouse origin via request body (E-COM-067)', async () => {
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
    // @ts-expect-error Mock order return
    vi.spyOn(dbModule, 'findOrderById').mockResolvedValue(mockOrder);

    const bookDoorstepPickupMock = vi.fn().mockResolvedValue({
      awb: 'SR99887766',
      courierName: 'Shiprocket Multi-Carrier',
      labelUrl: 'https://shiprocket.in/label.pdf'
    });

    const mockAdapter = {
      name: 'Shiprocket Multi-Carrier',
      supportsDoorstepPickup: true,
      bookDoorstepPickup: bookDoorstepPickupMock
    };

    // @ts-expect-error Mock registry
    vi.spyOn(shippingModule, 'getShippingRegistry').mockReturnValue({
      getOrThrow: vi.fn().mockReturnValue(mockAdapter)
    });

    vi.spyOn(dbModule, 'createOrderFulfillment').mockResolvedValue({
      // @ts-expect-error Mock fulfillment
      fulfillment: { id: 'fulf-2', trackingNumber: 'SR99887766' },
      // @ts-expect-error Mock order
      order: mockOrder
    });

    const customOrigin = {
      name: 'Bengaluru Fulfillment Center',
      phone: '+919123456789',
      line1: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India'
    };

    const req = new Request('http://localhost:3000/api/admin/orders/ord-123/book-pickup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'shiprocket',
        weightGrams: 500,
        origin: customOrigin
      })
    });

    const res = await bookPickupRoute(req, {
      params: Promise.resolve({ id: 'ord-123' })
    });
    expect(res.status).toBe(200);

    // Verify bookDoorstepPickup received custom origin from request body
    expect(bookDoorstepPickupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord-123',
        origin: customOrigin
      })
    );
  });
});
