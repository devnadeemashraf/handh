import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  countAnalyticsEvents,
  createStore,
  getFunnelMetrics,
  insertAnalyticsEvent,
  insertAnalyticsEventsBatch,
  listAnalyticsEvents
} from './repositories';
import { cleanupTestStore, closeDbClient } from './test-db-helper';

describe('Analytics Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `analytics-store-${Date.now()}`;
  let storeId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Analytics Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;
  });

  afterAll(async () => {
    if (storeId) {
      await cleanupTestStore(db, storeId);
    }
    await closeDbClient(db);
  });

  it('inserts and retrieves a single analytics event', async () => {
    const event = await insertAnalyticsEvent(db, {
      storeId,
      sessionId: 'sess_test_123',
      anonymousId: 'anon_test_123',
      eventType: 'page_viewed',
      entityType: 'page',
      entityId: '/products/artisanal-abaya',
      properties: { title: 'Artisanal Abaya' },
      pageUrl: 'https://handh.in/products/artisanal-abaya',
      referrer: 'https://instagram.com/',
      userAgent: 'Mozilla/5.0 TestBrowser',
      ipHash: 'hash_abc123'
    });

    expect(event.id).toBeDefined();
    expect(event.storeId).toBe(storeId);
    expect(event.sessionId).toBe('sess_test_123');
    expect(event.eventType).toBe('page_viewed');
    expect(event.properties).toEqual({ title: 'Artisanal Abaya' });
    expect(event.ipHash).toBe('hash_abc123');
    expect(event.createdAt).toBeInstanceOf(Date);
  });

  it('inserts a batch of analytics events', async () => {
    const batch = [
      {
        storeId,
        sessionId: 'sess_batch_1',
        anonymousId: 'anon_batch_1',
        eventType: 'product_viewed',
        entityType: 'product',
        entityId: 'prod_999',
        properties: { name: 'Silk Dupatta', price: 2999 },
        pageUrl: 'https://handh.in/products/silk-dupatta'
      },
      {
        storeId,
        sessionId: 'sess_batch_1',
        anonymousId: 'anon_batch_1',
        eventType: 'cart_item_added',
        entityType: 'cart',
        entityId: 'var_888',
        properties: { quantity: 1, price: 2999 },
        pageUrl: 'https://handh.in/products/silk-dupatta'
      }
    ];

    const inserted = await insertAnalyticsEventsBatch(db, batch);
    expect(inserted).toHaveLength(2);
    expect(inserted[0]?.eventType).toBe('product_viewed');
    expect(inserted[1]?.eventType).toBe('cart_item_added');
  });

  it('filters analytics events by sessionId, eventType, and date ranges', async () => {
    const uniqueSessionId = `sess_filter_${Date.now()}`;
    await insertAnalyticsEventsBatch(db, [
      {
        storeId,
        sessionId: uniqueSessionId,
        eventType: 'checkout_initiated',
        properties: { total: 4999 }
      },
      {
        storeId,
        sessionId: uniqueSessionId,
        eventType: 'order_completed',
        properties: { orderId: 'ord_123', total: 4999 }
      }
    ]);

    const sessionEvents = await listAnalyticsEvents(db, {
      storeId,
      sessionId: uniqueSessionId
    });
    expect(sessionEvents).toHaveLength(2);

    const checkoutEvents = await listAnalyticsEvents(db, {
      storeId,
      sessionId: uniqueSessionId,
      eventType: 'checkout_initiated'
    });
    expect(checkoutEvents).toHaveLength(1);
    expect(checkoutEvents[0]?.eventType).toBe('checkout_initiated');

    const totalCount = await countAnalyticsEvents(db, {
      storeId,
      sessionId: uniqueSessionId
    });
    expect(totalCount).toBe(2);
  });

  it('computes accurate conversion funnel metrics', async () => {
    const funnelStoreSlug = `funnel-store-${Date.now()}`;
    const funnelStore = await createStore(db, {
      slug: funnelStoreSlug,
      name: 'Funnel Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });

    try {
      await insertAnalyticsEventsBatch(db, [
        { storeId: funnelStore.id, sessionId: 's1', eventType: 'page_viewed', properties: {} },
        { storeId: funnelStore.id, sessionId: 's1', eventType: 'page_viewed', properties: {} },
        { storeId: funnelStore.id, sessionId: 's1', eventType: 'product_viewed', properties: {} },
        { storeId: funnelStore.id, sessionId: 's1', eventType: 'cart_item_added', properties: {} },
        {
          storeId: funnelStore.id,
          sessionId: 's1',
          eventType: 'checkout_initiated',
          properties: {}
        },
        { storeId: funnelStore.id, sessionId: 's1', eventType: 'order_completed', properties: {} }
      ]);

      const metrics = await getFunnelMetrics(db, { storeId: funnelStore.id });
      expect(metrics.pageViews).toBe(2);
      expect(metrics.productViews).toBe(1);
      expect(metrics.cartAdds).toBe(1);
      expect(metrics.checkoutsInitiated).toBe(1);
      expect(metrics.ordersCompleted).toBe(1);
    } finally {
      await cleanupTestStore(db, funnelStore.id);
    }
  });
});
