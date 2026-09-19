import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createDbClient, createUser } from '@hh/db';

import type { User } from '@hh/domain';

// Mock auth module
vi.mock('../../../lib/auth', () => {
  return {
    getCurrentUser: vi.fn(),
    requireUser: vi.fn(),
    getUserSession: vi.fn()
  };
});

import { requireUser } from '../../../lib/auth';
import { GET as getAddresses, POST as postAddress } from './addresses/route';
import { POST as postFamily } from './family/route';
import { GET as getOrders } from './orders/route';
import { POST as postWishlist } from './wishlist/route';

describe('User Platform API Routes', () => {
  let testUser: User;

  beforeAll(async () => {
    const databaseUrl =
      process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
    const db = createDbClient(databaseUrl);
    const testPhone = `+9198${Date.now().toString().slice(-8)}`;
    testUser = await createUser(db, 'hh', {
      phone: testPhone,
      name: 'Amina Begum',
      role: 'customer',
      whatsappOptIn: true
    });
  });

  describe('Address Book Routes', () => {
    it('rejects unauthenticated address list requests with 401', async () => {
      vi.mocked(requireUser).mockRejectedValueOnce(new Error('Authentication required'));

      const res = await getAddresses();
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('creates a new delivery address for authenticated user', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const req = new Request('http://localhost:3000/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Apartment',
          recipientName: 'Amina Begum',
          phone: testUser.phone,
          line1: 'Flat 101, Lakeview Residency',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500084',
          country: 'IN',
          isDefault: true
        })
      });

      const res = await postAddress(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.address.label).toBe('Apartment');
    });

    it('rejects address creation with invalid pincode with 400', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const req = new Request('http://localhost:3000/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Apartment',
          recipientName: 'Amina Begum',
          phone: testUser.phone,
          line1: 'Flat 101',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '123', // invalid PIN
          country: 'IN'
        })
      });

      const res = await postAddress(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('Family Profiles & Style Preferences', () => {
    it('creates family member with size and style preferences', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const req = new Request('http://localhost:3000/api/user/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Daughter Hiba',
          relationship: 'Daughter',
          preferences: {
            sizes: { abaya: 'S', hijab: 'Chiffon' },
            style: { preferredColors: ['Sage Green', 'Dusty Rose'], modestyLevel: 'full_coverage' }
          }
        })
      });

      const res = await postFamily(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.member.name).toBe('Daughter Hiba');
      expect(body.member.preferences.sizes?.abaya).toBe('S');
    });

    it('rejects family member creation with empty name with 400', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const req = new Request('http://localhost:3000/api/user/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          relationship: 'Daughter'
        })
      });

      const res = await postFamily(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('Wishlist Routes', () => {
    it('rejects adding to wishlist without productId with 400', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const req = new Request('http://localhost:3000/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const res = await postWishlist(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('Order History Route', () => {
    it('fetches order history for authenticated customer', async () => {
      vi.mocked(requireUser).mockResolvedValue(testUser);

      const res = await getOrders();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.orders)).toBe(true);
    });
  });
});
