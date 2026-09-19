import type { Coupon, CouponValidationResult } from './types';

/**
 * Calculates the discount in minor units (paise) for a valid coupon against a given subtotal.
 */
export function calculateDiscount(coupon: Coupon, subtotalMinor: number): number {
  if (subtotalMinor <= 0) {
    return 0;
  }

  let discount = 0;

  if (coupon.discountType === 'fixed') {
    discount = Math.min(coupon.value, subtotalMinor);
  } else if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotalMinor * coupon.value) / 100);
    if (
      coupon.maxDiscountMinor !== null &&
      coupon.maxDiscountMinor !== undefined &&
      coupon.maxDiscountMinor > 0
    ) {
      discount = Math.min(discount, coupon.maxDiscountMinor);
    }
    discount = Math.min(discount, subtotalMinor);
  }

  return Math.max(0, discount);
}

/**
 * Validates a coupon's eligibility against business constraints (status, dates, limits, min cart total).
 */
export function validateCoupon(
  coupon: Coupon | null | undefined,
  input: { subtotalMinor: number; now?: Date }
): CouponValidationResult {
  if (!coupon) {
    return {
      valid: false,
      reason: 'Invalid or unrecognized promotional code.'
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      reason: 'This promotional code is currently inactive.'
    };
  }

  const currentTime = input.now ?? new Date();

  if (coupon.startsAt) {
    const startTime = new Date(coupon.startsAt);
    if (currentTime < startTime) {
      return {
        valid: false,
        reason: 'This promotional campaign has not started yet.'
      };
    }
  }

  if (coupon.expiresAt) {
    const expireTime = new Date(coupon.expiresAt);
    if (currentTime > expireTime) {
      return {
        valid: false,
        reason: 'This promotional code has expired.'
      };
    }
  }

  if (
    coupon.usageLimit !== null &&
    coupon.usageLimit !== undefined &&
    coupon.usageLimit > 0 &&
    coupon.timesUsed >= coupon.usageLimit
  ) {
    return {
      valid: false,
      reason: 'This promotional code has reached its maximum redemption limit.'
    };
  }

  if (input.subtotalMinor < coupon.minOrderValueMinor) {
    const minFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(coupon.minOrderValueMinor / 100);

    return {
      valid: false,
      reason: `Minimum order value of ${minFormatted} required to apply this code.`
    };
  }

  const discountMinor = calculateDiscount(coupon, input.subtotalMinor);
  const newSubtotalMinor = Math.max(0, input.subtotalMinor - discountMinor);

  return {
    valid: true,
    coupon,
    discountMinor,
    newSubtotalMinor
  };
}
