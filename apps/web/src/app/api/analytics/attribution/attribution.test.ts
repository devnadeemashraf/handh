import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock @hh/domain
vi.mock('@hh/domain', () => ({
  orderAttributionSchema: {
    safeParse: vi.fn((data: unknown) => {
      if (data && typeof data === 'object' && 'source' in data) {
        return { success: true, data };
      }
      return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } };
    })
  }
}));

import { DELETE, POST } from './route';

describe('POST /api/analytics/attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for empty body', async () => {
    const req = new Request('http://localhost/api/analytics/attribution', {
      method: 'POST',
      body: 'invalid-json',
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when attribution schema validation fails', async () => {
    const req = new Request('http://localhost/api/analytics/attribution', {
      method: 'POST',
      body: JSON.stringify({ attribution: { bad: 'data' }, storedAt: Date.now() }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('sets HTTP-only Set-Cookie header on valid attribution', async () => {
    const attribution = {
      source: 'instagram',
      medium: 'bio_link',
      campaign: 'summer',
      landingPage: '/products/abaya',
      capturedAt: new Date().toISOString()
    };
    const req = new Request('http://localhost/api/analytics/attribution', {
      method: 'POST',
      body: JSON.stringify({ attribution, storedAt: Date.now() }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('hh_attribution_v1=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Max-Age=2592000');
  });
});

describe('DELETE /api/analytics/attribution', () => {
  it('clears the attribution cookie with Max-Age=0', async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('hh_attribution_v1=;');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).toContain('HttpOnly');
  });
});
