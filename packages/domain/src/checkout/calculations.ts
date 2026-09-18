import { Money, type CurrencyCode } from '../money';
import type { CheckoutFinancialBreakdown } from './types';

export const DEFAULT_SHIPPING_FEE_MINOR = 9900; // ₹99.00
export const DEFAULT_FREE_SHIPPING_THRESHOLD_MINOR = 99900; // ₹999.00

export interface CalculateFinancialsOptions {
  standardShippingFeeMinor?: number;
  freeShippingThresholdMinor?: number;
  discountMinor?: number;
}

/**
 * Calculates authoritative checkout financials using the Money value object.
 * Enforces zero floating-point arithmetic.
 */
export function calculateCheckoutFinancials(
  subtotalMinor: number,
  currency: CurrencyCode = 'INR',
  options: CalculateFinancialsOptions = {}
): CheckoutFinancialBreakdown {
  const subtotal = Money.fromMinor(subtotalMinor, currency);
  const thresholdMinor =
    options.freeShippingThresholdMinor ?? DEFAULT_FREE_SHIPPING_THRESHOLD_MINOR;
  const standardFeeMinor = options.standardShippingFeeMinor ?? DEFAULT_SHIPPING_FEE_MINOR;
  const discount = Money.fromMinor(options.discountMinor ?? 0, currency);

  const isFreeDelivery = subtotal.amountMinor >= thresholdMinor;
  const shipping = isFreeDelivery
    ? Money.zero(currency)
    : Money.fromMinor(standardFeeMinor, currency);

  const remainingForFreeDeliveryMinor = isFreeDelivery
    ? 0
    : Math.max(0, thresholdMinor - subtotal.amountMinor);

  const total = subtotal.add(shipping).subtract(discount);

  return {
    subtotalMinor: subtotal.amountMinor,
    shippingMinor: shipping.amountMinor,
    discountMinor: discount.amountMinor,
    totalMinor: Math.max(0, total.amountMinor),
    currency,
    isFreeDelivery,
    freeDeliveryThresholdMinor: thresholdMinor,
    remainingForFreeDeliveryMinor
  };
}

/**
 * Generates an immutable, human-friendly order reference number.
 * e.g., "HH-2026-X8K2P"
 */
export function generateOrderNumber(prefix = 'HH'): string {
  const year = new Date().getUTCFullYear();
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}-${randomChars}`;
}
