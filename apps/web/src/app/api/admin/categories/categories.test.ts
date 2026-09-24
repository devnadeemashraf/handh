import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { Category, Store } from '@hh/db';

import { GET as handleGetCategories } from './route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findStoreBySlug: vi.fn(),
  getCategoryTree: vi.fn(),
  listCategoriesByStore: vi.fn()
}));

describe('Admin Categories API Route (GET /api/admin/categories)', () => {
  const mockAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'admin-uuid-1',
      email: 'admin@handh.in',
      role: 'superadmin'
    }
  } as unknown as AdminSessionContext;

  const mockStore = {
    id: 'store-1',
    slug: 'hh',
    name: 'H&H'
  } as Store;

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      storeId: 'store-1',
      parentId: null,
      slug: 'jewelry',
      name: 'Jewelry',
      description: null,
      sortOrder: 0,
      path: '/jewelry',
      depth: 0,
      applicableFilterKeys: ['finish', 'material'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

    const res = await handleGetCategories();
    expect(res.status).toBe(401);
  });

  it('returns 404 when store is not found', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(null);

    const res = await handleGetCategories();
    expect(res.status).toBe(404);
  });

  it('returns category tree and flat list on success', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(mockStore);
    vi.mocked(dbModule.getCategoryTree).mockResolvedValue([]);
    vi.mocked(dbModule.listCategoriesByStore).mockResolvedValue(mockCategories);

    const res = await handleGetCategories();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.flat).toHaveLength(1);
    expect(body.flat[0].name).toBe('Jewelry');
    expect(body.flat[0].applicableFilterKeys).toEqual(['finish', 'material']);
  });
});
