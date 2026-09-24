import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { ServiceControlConfig } from '@hh/domain';

import { GET } from './route';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  getStoreServiceControl: vi.fn()
}));

describe('Service Status API Route (GET /api/service-status)', () => {
  const normalConfig: ServiceControlConfig = {
    operatingStatus: 'active',
    checkoutEnabled: true,
    paymentsEnabled: true,
    headline: 'Welcome to H&H',
    maintenanceNotice: ''
  };

  const maintenanceConfig: ServiceControlConfig = {
    operatingStatus: 'maintenance',
    checkoutEnabled: false,
    paymentsEnabled: false,
    headline: 'Maintenance Mode',
    maintenanceNotice: 'We are currently upgrading payment settlement infrastructure.'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns operating service status config for active storefront', async () => {
    vi.mocked(dbModule.getStoreServiceControl).mockResolvedValue(normalConfig);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.serviceControl.checkoutEnabled).toBe(true);
    expect(body.serviceControl.operatingStatus).toBe('active');
  });

  it('returns maintenance mode config when checkout is paused', async () => {
    vi.mocked(dbModule.getStoreServiceControl).mockResolvedValue(maintenanceConfig);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.serviceControl.checkoutEnabled).toBe(false);
    expect(body.serviceControl.operatingStatus).toBe('maintenance');
    expect(body.serviceControl.maintenanceNotice).toContain('upgrading payment settlement');
  });

  it('handles query failures gracefully with 500', async () => {
    vi.mocked(dbModule.getStoreServiceControl).mockRejectedValue(
      new Error('Connection terminated unexpectedly')
    );

    const response = await GET();
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Connection terminated');
  });
});
