import { describe, expect, it } from 'vitest';

import { calculateDiscount, validateCoupon } from './calculations';

import type { Coupon } from './types';

const baseCoupon: Coupon = {
  id: 'c1',
  code: 'WELCOME10',
  discountType: 'percentage',
  value: 10, // 10%
  minOrderValueMinor: 50000, // ₹500
  maxDiscountMinor: 20000, // ₹200 cap
  usageLimit: 100,
  timesUsed: 10,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  createdAt: '2026-09-01T00:00:00Z'
};

describe('Coupon Domain Logic', () => {
  describe('calculateDiscount', () => {
    it('calculates percentage discount accurately within limits', () => {
      // 10% of ₹1000 (100000 paise) = ₹100 (10000 paise)
      const discount = calculateDiscount(baseCoupon, 100000);
      expect(discount).toBe(10000);
    });

    it('respects max discount cap for percentage coupons', () => {
      // 10% of ₹3000 (300000 paise) = ₹300, capped at ₹200 (20000 paise)
      const discount = calculateDiscount(baseCoupon, 300000);
      expect(discount).toBe(20000);
    });

    it('calculates fixed discount accurately', () => {
      const fixedCoupon: Coupon = {
        ...baseCoupon,
        code: 'FLAT150',
        discountType: 'fixed',
        value: 15000 // ₹150
      };

      const discount = calculateDiscount(fixedCoupon, 100000);
      expect(discount).toBe(15000);
    });

    it('caps fixed discount at subtotal if subtotal is smaller', () => {
      const fixedCoupon: Coupon = {
        ...baseCoupon,
        code: 'FLAT150',
        discountType: 'fixed',
        value: 15000 // ₹150
      };

      const discount = calculateDiscount(fixedCoupon, 10000);
      expect(discount).toBe(10000);
    });
  });

  describe('validateCoupon', () => {
    it('succeeds for an active and eligible coupon', () => {
      const result = validateCoupon(baseCoupon, { subtotalMinor: 100000 });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.discountMinor).toBe(10000);
        expect(result.newSubtotalMinor).toBe(90000);
      }
    });

    it('rejects nonexistent coupon', () => {
      const result = validateCoupon(null, { subtotalMinor: 100000 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('Invalid or unrecognized');
      }
    });

    it('rejects inactive coupon', () => {
      const result = validateCoupon({ ...baseCoupon, isActive: false }, { subtotalMinor: 100000 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('inactive');
      }
    });

    it('rejects coupon when subtotal does not meet minimum threshold', () => {
      const result = validateCoupon(baseCoupon, { subtotalMinor: 30000 }); // ₹300 < ₹500
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('Minimum order value');
      }
    });

    it('rejects expired coupon', () => {
      const expiredCoupon: Coupon = {
        ...baseCoupon,
        expiresAt: '2026-09-10T00:00:00Z'
      };
      const result = validateCoupon(expiredCoupon, {
        subtotalMinor: 100000,
        now: new Date('2026-09-15T00:00:00Z')
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('expired');
      }
    });

    it('rejects coupon that has reached its usage limit', () => {
      const exhaustedCoupon: Coupon = {
        ...baseCoupon,
        usageLimit: 5,
        timesUsed: 5
      };
      const result = validateCoupon(exhaustedCoupon, { subtotalMinor: 100000 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('maximum redemption limit');
      }
    });

    it('rejects coupon before campaign start date', () => {
      const futureCoupon: Coupon = {
        ...baseCoupon,
        startsAt: '2026-10-01T00:00:00Z'
      };
      const result = validateCoupon(futureCoupon, {
        subtotalMinor: 100000,
        now: new Date('2026-09-15T00:00:00Z')
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('has not started yet');
      }
    });
  });
});
