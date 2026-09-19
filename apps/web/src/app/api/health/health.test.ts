import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('/api/health Route', () => {
  it('returns health status, services status, and system telemetry', async () => {
    const response = await GET();
    expect([200, 503]).toContain(response.status);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.status);
    expect(body).toHaveProperty('services');
    expect(body.services).toHaveProperty('database');
    expect(body.services).toHaveProperty('redis');
    expect(body).toHaveProperty('system');
    expect(body.system).toHaveProperty('memory');
    expect(body.system).toHaveProperty('nodeVersion');
    expect(body).toHaveProperty('timestamp');
  });
});
