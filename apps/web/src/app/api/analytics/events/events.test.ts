import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import { POST } from './route';

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn().mockReturnValue({}),
  findStoreByHostname: vi.fn(),
  findStoreBySlug: vi.fn(),
  insertAnalyticsEventsBatch: vi.fn()
}));

describe('Analytics Events Beacon API (POST /api/analytics/events)', () => {
  const mockStore = {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'hh',
    name: 'H&H Luxury'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(mockStore as unknown as dbModule.Store);
    vi.mocked(dbModule.findStoreByHostname).mockResolvedValue(null);
    vi.mocked(dbModule.insertAnalyticsEventsBatch).mockImplementation(
      async (_db, events) => events as unknown as dbModule.AnalyticsEvent[]
    );
  });

  it('rejects empty or invalid payloads with 400 Bad Request', async () => {
    const request = new Request('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Validation failed');
  });

  it('successfully ingests a single event payload', async () => {
    const eventPayload = {
      sessionId: 'sess_12345678',
      anonymousId: 'anon_abcdef',
      eventType: 'page_viewed',
      properties: { path: '/collections/luxury-abayas' },
      pageUrl: 'https://handh.in/collections/luxury-abayas'
    };

    const request = new Request('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.195',
        'user-agent': 'Mozilla/5.0 LuxuryAgent',
        referer: 'https://instagram.com/'
      },
      body: JSON.stringify(eventPayload)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);

    expect(dbModule.insertAnalyticsEventsBatch).toHaveBeenCalledTimes(1);
    const insertedArgs = vi.mocked(dbModule.insertAnalyticsEventsBatch).mock.calls[0]![1];
    expect(insertedArgs).toHaveLength(1);
    expect(insertedArgs[0]?.storeId).toBe(mockStore.id);
    expect(insertedArgs[0]?.sessionId).toBe('sess_12345678');
    expect(insertedArgs[0]?.eventType).toBe('page_viewed');
    expect(insertedArgs[0]?.userAgent).toBe('Mozilla/5.0 LuxuryAgent');
    expect(insertedArgs[0]?.referrer).toBe('https://instagram.com/');
    // Raw IP should NOT be stored; hashed version must be present
    expect(insertedArgs[0]?.ipHash).toBeDefined();
    expect(insertedArgs[0]?.ipHash).not.toContain('203.0.113.195');
    expect(insertedArgs[0]?.ipHash).toHaveLength(64); // SHA-256 hex string
  });

  it('supports batch event ingestion', async () => {
    const batchPayload = {
      events: [
        {
          sessionId: 'sess_batch',
          eventType: 'product_viewed',
          entityType: 'product',
          entityId: 'prod_1',
          properties: { title: 'Royal Cashmere Stole' }
        },
        {
          sessionId: 'sess_batch',
          eventType: 'cart_item_added',
          entityType: 'cart',
          entityId: 'var_1',
          properties: { quantity: 1 }
        }
      ]
    };

    const request = new Request('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(batchPayload)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);

    expect(dbModule.insertAnalyticsEventsBatch).toHaveBeenCalledTimes(1);
    const insertedArgs = vi.mocked(dbModule.insertAnalyticsEventsBatch).mock.calls[0]![1];
    expect(insertedArgs).toHaveLength(2);
  });

  it('supports navigator.sendBeacon text/plain content type', async () => {
    const eventPayload = {
      sessionId: 'sess_beacon',
      eventType: 'page_viewed',
      properties: { path: '/' }
    };

    const request = new Request('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: JSON.stringify(eventPayload)
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);
  });

  it('returns 404 when target store is not found', async () => {
    vi.mocked(dbModule.findStoreBySlug).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/analytics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'sess_nostore',
        eventType: 'page_viewed',
        properties: {}
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
