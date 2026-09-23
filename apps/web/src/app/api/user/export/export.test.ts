import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';
import type { User, UserDataExport } from '@hh/domain';

import * as authModule from '../../../../lib/auth';
import { GET as exportRoute } from './route';

describe('User Data Export API Route (GET /api/user/export)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser: User = {
    id: 'user-uuid-123',
    storeId: 'store-uuid-1',
    phone: '+919876543210',
    phoneVerified: true,
    email: 'fatima@example.com',
    emailVerified: true,
    name: 'Fatima Begum',
    avatarUrl: null,
    role: 'customer',
    whatsappOptIn: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockExport: UserDataExport = {
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    dataFiduciary: {
      name: 'H&H Luxury Modest Wear Private Limited',
      cin: 'U18109TG2026PTC198765',
      registeredAddress: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033, India',
      grievanceEmail: 'grievance@handh.local'
    },
    notice: 'Data provided pursuant to DPDP Act, 2023 §12',
    user: {
      id: mockUser.id,
      phone: mockUser.phone,
      email: mockUser.email ?? null,
      name: mockUser.name ?? null,
      whatsappOptIn: mockUser.whatsappOptIn,
      createdAt: mockUser.createdAt
    },
    addresses: [
      {
        id: 'addr-1',
        label: 'Home',
        recipientName: 'Fatima Begum',
        phone: '+919876543210',
        line1: 'Banjara Hills',
        line2: null,
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500034',
        country: 'IN',
        isDefault: true,
        createdAt: new Date().toISOString()
      }
    ],
    familyMembers: [],
    wishlist: [],
    orders: []
  };

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(authModule, 'requireUser').mockRejectedValue(new Error('Authentication required'));

    const res = await exportRoute();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  it('exports structured personal data archive with attachment headers for authenticated users', async () => {
    vi.spyOn(authModule, 'requireUser').mockResolvedValue(mockUser);
    vi.spyOn(dbModule, 'getSharedDbClient').mockReturnValue({} as DatabaseClient);
    vi.spyOn(dbModule, 'exportUserData').mockResolvedValue(mockExport);

    const res = await exportRoute();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain(
      'hh-user-data-export-user-uuid-123.json'
    );

    const data = await res.json();
    expect(data.exportVersion).toBe('1.0');
    expect(data.dataFiduciary.name).toContain('H&H');
    expect(data.user.phone).toBe('+919876543210');
    expect(data.addresses.length).toBe(1);
  });
});
