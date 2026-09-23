import { describe, expect, it } from 'vitest';

import { GET as handleServiceability } from './route';

describe('Postal Code Serviceability API Route (E-COM-063)', () => {
  it('returns 400 when pincode parameter is missing', async () => {
    const req = new Request('http://localhost:3000/api/shipping/serviceability');
    const res = await handleServiceability(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('PIN code query parameter is required');
  });

  it('returns 400 when pincode is not a valid 6-digit Indian PIN code', async () => {
    const req1 = new Request('http://localhost:3000/api/shipping/serviceability?pincode=12345');
    const res1 = await handleServiceability(req1);
    expect(res1.status).toBe(400);

    const req2 = new Request('http://localhost:3000/api/shipping/serviceability?pincode=012345');
    const res2 = await handleServiceability(req2);
    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.error).toContain('cannot begin with 0');
  });

  it('returns 200 with isServiceable: true for serviceable Indian PIN codes', async () => {
    const req = new Request('http://localhost:3000/api/shipping/serviceability?pincode=500034');
    const res = await handleServiceability(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.serviceability.isServiceable).toBe(true);
    expect(data.serviceability.postalCode).toBe('500034');
    expect(data.serviceability.state).toBe('Telangana');
    expect(data.serviceability.estimatedDaysMin).toBeGreaterThanOrEqual(1);
  });

  it('returns 200 with isServiceable: false for unserviceable PIN codes (E-COM-063 audit case)', async () => {
    const req = new Request('http://localhost:3000/api/shipping/serviceability?pincode=790001');
    const res = await handleServiceability(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.serviceability.isServiceable).toBe(false);
    expect(data.serviceability.message).toContain(
      'Delivery is currently not available to PIN 790001'
    );
  });

  it('returns 200 with isServiceable: false for military APS codes (Zone 9)', async () => {
    const req = new Request('http://localhost:3000/api/shipping/serviceability?pincode=900001');
    const res = await handleServiceability(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.serviceability.isServiceable).toBe(false);
  });
});
