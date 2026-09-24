import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminAuthModule from '@/lib/admin-auth';

import type { AdminSessionContext } from '@/lib/admin-auth';

import * as dbModule from '@hh/db';

import type { ExecutiveInsightsData } from '@hh/domain';

import { GET as handleGetInsights } from './route';

vi.mock('@/lib/admin-auth', () => ({
  getAdminSession: vi.fn()
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  getExecutiveInsights: vi.fn()
}));

describe('Admin Executive Insights API Route (GET /api/admin/insights)', () => {
  const mockAdminContext = {
    session: { id: 'sess-1' },
    admin: {
      id: 'admin-uuid-1',
      email: 'admin@handh.in',
      role: 'superadmin'
    }
  } as unknown as AdminSessionContext;

  const mockInsights: ExecutiveInsightsData = {
    timeframe: 'week',
    sales: {
      revenueMinor: 15000000,
      orderCount: 150,
      aovMinor: 100000,
      pendingFulfillmentCount: 10
    },
    customers: {
      totalCustomers: 100,
      repeatCustomers: 20,
      repeatRatePercentage: 20,
      topCustomers: []
    },
    productVelocity: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthorized', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/admin/insights');
    const res = await handleGetInsights(request);
    expect(res.status).toBe(401);
  });

  it('defaults to week timeframe and returns executive insights on success', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
    vi.mocked(dbModule.getExecutiveInsights).mockResolvedValue(mockInsights);

    const request = new Request('http://localhost:3000/api/admin/insights');
    const res = await handleGetInsights(request);
    expect(res.status).toBe(200);

    const body = await responseBody(res);
    expect(body.success).toBe(true);
    expect(body.insights.sales.revenueMinor).toBe(15000000);
    expect(dbModule.getExecutiveInsights).toHaveBeenCalledWith(expect.anything(), 'hh', 'week');
  });

  it('respects timeframe query parameter when valid', async () => {
    vi.mocked(adminAuthModule.getAdminSession).mockResolvedValue(mockAdminContext);
    vi.mocked(dbModule.getExecutiveInsights).mockResolvedValue(mockInsights);

    const request = new Request('http://localhost:3000/api/admin/insights?timeframe=month');
    const res = await handleGetInsights(request);
    expect(res.status).toBe(200);

    expect(dbModule.getExecutiveInsights).toHaveBeenCalledWith(expect.anything(), 'hh', 'month');
  });
});

async function responseBody(res: Response) {
  return res.json();
}
