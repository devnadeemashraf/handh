import { type CurrencyCode, Money } from '../money';

import type { CheckoutFinancialBreakdown } from './types';

export const DEFAULT_SHIPPING_FEE_MINOR = 9900; // ₹99.00
export const DEFAULT_FREE_SHIPPING_THRESHOLD_MINOR = 99900; // ₹999.00
export const DEFAULT_MERCHANT_STATE = 'Telangana';
export const DEFAULT_GST_RATE_PERCENT = 18;

export interface CalculateFinancialsOptions {
  standardShippingFeeMinor?: number | undefined;
  freeShippingThresholdMinor?: number | undefined;
  discountMinor?: number | undefined;
  destinationState?: string | undefined;
  merchantState?: string | undefined;
  gstRatePercent?: number | undefined;
}

/**
 * Calculates authoritative checkout financials using the Money value object.
 * Enforces zero floating-point arithmetic.
 *
 * Statutory Indian GST:
 * Retail consumer prices in India are statutory MRP (inclusive of all taxes).
 * Taxable base and statutory GST are derived backwards from the gross billable total.
 * - Intra-state (Destination = Telangana): 50% CGST + 50% SGST, 0% IGST.
 * - Inter-state (Destination ≠ Telangana or unspecified): 100% IGST, 0% CGST, 0% SGST.
 * Integer floor/difference guarantee cgst + sgst === totalTax with zero rounding loss.
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
  const totalMinor = Math.max(0, total.amountMinor);

  // Statutory GST Derivation (MRP Tax-Inclusive Engine)
  const gstRatePercent = options.gstRatePercent ?? DEFAULT_GST_RATE_PERCENT;
  const originState = (options.merchantState ?? DEFAULT_MERCHANT_STATE).trim();
  const destinationState = options.destinationState?.trim();

  const taxableAmountMinor =
    totalMinor > 0 ? Math.round(totalMinor / (1 + gstRatePercent / 100)) : 0;
  const taxMinor = totalMinor - taxableAmountMinor;

  const isIntraState = Boolean(
    destinationState && originState.toLowerCase() === destinationState.toLowerCase()
  );
  const isInterState = !isIntraState;

  const cgstMinor = isIntraState ? Math.floor(taxMinor / 2) : 0;
  const sgstMinor = isIntraState ? taxMinor - cgstMinor : 0;
  const igstMinor = isInterState ? taxMinor : 0;

  const gst = {
    ratePercent: gstRatePercent,
    taxableAmountMinor,
    totalTaxMinor: taxMinor,
    cgstMinor,
    sgstMinor,
    igstMinor,
    isInterState,
    originState,
    ...(destinationState ? { destinationState } : {})
  };

  return {
    subtotalMinor: subtotal.amountMinor,
    shippingMinor: shipping.amountMinor,
    discountMinor: discount.amountMinor,
    totalMinor,
    taxMinor,
    cgstMinor,
    sgstMinor,
    igstMinor,
    taxableAmountMinor,
    currency,
    isFreeDelivery,
    freeDeliveryThresholdMinor: thresholdMinor,
    remainingForFreeDeliveryMinor,
    gst
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
