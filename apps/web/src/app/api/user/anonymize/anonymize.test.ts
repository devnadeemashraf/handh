import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';
import type { User, UserAnonymizationResult } from '@hh/domain';

import * as authModule from '../../../../lib/auth';
import { POST as anonymizeRoute } from './route';

describe('User Anonymization API Route (POST /api/user/anonymize)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockUser: User = {
    id: 'user-uuid-456',
    storeId: 'store-uuid-1',
    phone: '+919876543210',
    phoneVerified: true,
    email: 'zainab@example.com',
    emailVerified: true,
    name: 'Zainab Bibi',
    avatarUrl: null,
    role: 'customer',
    whatsappOptIn: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockAnonymizeResult: UserAnonymizationResult = {
    userId: 'user-uuid-456',
    anonymizedAt: new Date().toISOString(),
    redactedRecords: {
      addressesCount: 2,
      familyMembersCount: 1,
      wishlistItemsCount: 3,
      sessionsRevokedCount: 1,
      ordersAnonymizedCount: 1
    }
  };

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(authModule, 'requireUser').mockRejectedValue(new Error('Authentication required'));

    const res = await anonymizeRoute();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Authentication required');
  });

  it('anonymizes account, clears session cookie, and returns statutory confirmation', async () => {
    vi.spyOn(authModule, 'requireUser').mockResolvedValue(mockUser);
    vi.spyOn(dbModule, 'getSharedDbClient').mockReturnValue({} as DatabaseClient);
    vi.spyOn(dbModule, 'anonymizeUser').mockResolvedValue(mockAnonymizeResult);

    const res = await anonymizeRoute();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('DPDP Act, 2023');
    expect(data.message).toContain('CGST Act, 2017 §36');
    expect(data.result.userId).toBe('user-uuid-456');
    expect(data.result.redactedRecords.addressesCount).toBe(2);

    // Verify session cookie deletion
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('hh_session=');
  });

  it('returns 409 conflict when user has already been anonymized', async () => {
    vi.spyOn(authModule, 'requireUser').mockResolvedValue(mockUser);
    vi.spyOn(dbModule, 'getSharedDbClient').mockReturnValue({} as DatabaseClient);
    vi.spyOn(dbModule, 'anonymizeUser').mockRejectedValue(
      new Error("User with ID 'user-uuid-456' has already been anonymized/deleted.")
    );

    const res = await anonymizeRoute();
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('already been anonymized');
  });
});
