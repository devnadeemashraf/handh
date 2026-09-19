import { describe, it, expect, beforeAll } from 'vitest';
import { createDbClient } from './index';
import {
  createStore,
  createCoupon,
  findCouponByCode,
  listCoupons,
  updateCoupon,
  incrementCouponUsage
} from './repositories';

describe('Coupon Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `coupon-store-${Date.now()}`;
  let couponId: string;

  beforeAll(async () => {
    await createStore(db, {
      slug: testStoreSlug,
      name: 'Coupon Test Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
  });

  it('creates and finds a coupon by code with case normalization', async () => {
    const created = await createCoupon(db, testStoreSlug, {
      code: 'festival20',
      discountType: 'percentage',
      value: 20,
      minOrderValueMinor: 100000,
      maxDiscountMinor: 50000,
      usageLimit: 200,
      isActive: true
    });

    expect(created.id).toBeDefined();
    expect(created.code).toBe('FESTIVAL20');
    expect(created.discountType).toBe('percentage');
    expect(created.value).toBe(20);
    expect(created.minOrderValueMinor).toBe(100000);
    expect(created.maxDiscountMinor).toBe(50000);
    expect(created.timesUsed).toBe(0);
    expect(created.isActive).toBe(true);

    couponId = created.id;

    // Lookup with lowercase code should succeed
    const found = await findCouponByCode(db, testStoreSlug, 'festival20');
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.code).toBe('FESTIVAL20');
  });

  it('lists all promotional coupons for the store in descending order', async () => {
    await createCoupon(db, testStoreSlug, {
      code: 'WELCOME50',
      discountType: 'fixed',
      value: 5000,
      minOrderValueMinor: 50000,
      isActive: true
    });

    const list = await listCoupons(db, testStoreSlug);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0]?.code).toBe('WELCOME50');
  });

  it('updates coupon status and constraints', async () => {
    const updated = await updateCoupon(db, testStoreSlug, couponId, {
      isActive: false,
      maxDiscountMinor: 60000
    });

    expect(updated.isActive).toBe(false);
    expect(updated.maxDiscountMinor).toBe(60000);

    const reFetched = await findCouponByCode(db, testStoreSlug, 'FESTIVAL20');
    expect(reFetched?.isActive).toBe(false);
  });

  it('increments coupon usage atomically', async () => {
    await incrementCouponUsage(db, couponId);
    await incrementCouponUsage(db, couponId);

    const reFetched = await findCouponByCode(db, testStoreSlug, 'FESTIVAL20');
    expect(reFetched?.timesUsed).toBe(2);
  });
});
