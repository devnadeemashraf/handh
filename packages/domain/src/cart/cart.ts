import { Money, type CurrencyCode } from '../money';
import type { CartItemDetail, CartSummary } from './types';

/**
 * Reconciles and computes authoritative cart calculations.
 * Ensures all monetary operations use the Money value object in minor units.
 */
export function buildCartSummary(
  items: CartItemDetail[],
  currency: CurrencyCode = 'INR'
): CartSummary {
  let subtotal = Money.zero(currency);
  let totalQuantity = 0;
  let allItemsValid = items.length > 0;

  const reconciledItems: CartItemDetail[] = items.map((item) => {
    let effectiveQuantity = item.requestedQuantity;
    let statusNotice = item.statusNotice ?? 'ok';
    let isAvailable = item.isAvailable;

    if (statusNotice === 'unavailable') {
      effectiveQuantity = 0;
      isAvailable = false;
      allItemsValid = false;
    } else if (!isAvailable || item.availableQuantity <= 0) {
      effectiveQuantity = 0;
      statusNotice = 'out_of_stock';
      isAvailable = false;
      allItemsValid = false;
    } else if (item.requestedQuantity > item.availableQuantity) {
      effectiveQuantity = item.availableQuantity;
      statusNotice = 'quantity_reduced';
      allItemsValid = false; // Requires user to acknowledge the adjusted quantity
    }

    const itemMoney = Money.fromMinor(item.priceMinor, currency);
    const lineTotal = itemMoney.multiply(effectiveQuantity);

    subtotal = subtotal.add(lineTotal);
    totalQuantity += effectiveQuantity;

    return {
      ...item,
      effectiveQuantity,
      lineTotalMinor: lineTotal.amountMinor,
      isAvailable,
      statusNotice
    };
  });

  const isValidForCheckout = allItemsValid && totalQuantity > 0;

  return {
    items: reconciledItems,
    subtotalMinor: subtotal.amountMinor,
    currency,
    totalQuantity,
    isValidForCheckout
  };
}
