import { describe, expect, it } from 'vitest';

import { buildCartSummary } from './cart';
import { type CartItemDetail, CartItemInputSchema, CartValidationInputSchema } from './types';

describe('Cart Domain Calculations & Reconciliation', () => {
  it('correctly calculates subtotal and line totals in minor units (paise)', () => {
    const items: CartItemDetail[] = [
      {
        variantId: '11111111-1111-1111-1111-111111111111',
        productId: '22222222-2222-2222-2222-222222222222',
        productSlug: 'pearl-glow-nose-piece',
        productTitle: 'Pearl Glow Nose Piece',
        variantTitle: 'Default Variant',
        sku: 'HH-NOSE-001',
        priceMinor: 59900,
        currency: 'INR',
        availableQuantity: 5,
        requestedQuantity: 2,
        effectiveQuantity: 2,
        lineTotalMinor: 0,
        isAvailable: true
      },
      {
        variantId: '33333333-3333-3333-3333-333333333333',
        productId: '44444444-4444-4444-4444-444444444444',
        productSlug: 'crystal-floral-nose-piece',
        productTitle: 'Crystal Floral Nose Piece',
        variantTitle: 'Default Variant',
        sku: 'HH-NOSE-003',
        priceMinor: 79900,
        currency: 'INR',
        availableQuantity: 5,
        requestedQuantity: 1,
        effectiveQuantity: 1,
        lineTotalMinor: 0,
        isAvailable: true
      }
    ];

    const summary = buildCartSummary(items, 'INR');

    expect(summary.totalQuantity).toBe(3);
    // 2 * 59900 + 1 * 79900 = 119800 + 79900 = 199700 paise (₹1997.00)
    expect(summary.subtotalMinor).toBe(199700);
    expect(summary.isValidForCheckout).toBe(true);
    expect(summary.items[0]?.lineTotalMinor).toBe(119800);
    expect(summary.items[1]?.lineTotalMinor).toBe(79900);
  });

  it('marks item out_of_stock and invalidates checkout when available stock is 0', () => {
    const items: CartItemDetail[] = [
      {
        variantId: '11111111-1111-1111-1111-111111111111',
        productId: '22222222-2222-2222-2222-222222222222',
        productSlug: 'pearl-glow-nose-piece',
        productTitle: 'Pearl Glow Nose Piece',
        variantTitle: 'Default Variant',
        sku: 'HH-NOSE-001',
        priceMinor: 59900,
        currency: 'INR',
        availableQuantity: 0, // Out of stock
        requestedQuantity: 1,
        effectiveQuantity: 1,
        lineTotalMinor: 59900,
        isAvailable: true
      }
    ];

    const summary = buildCartSummary(items, 'INR');

    expect(summary.items[0]?.statusNotice).toBe('out_of_stock');
    expect(summary.items[0]?.effectiveQuantity).toBe(0);
    expect(summary.items[0]?.lineTotalMinor).toBe(0);
    expect(summary.totalQuantity).toBe(0);
    expect(summary.subtotalMinor).toBe(0);
    expect(summary.isValidForCheckout).toBe(false);
  });

  it('reduces quantity when requested exceeds available stock', () => {
    const items: CartItemDetail[] = [
      {
        variantId: '11111111-1111-1111-1111-111111111111',
        productId: '22222222-2222-2222-2222-222222222222',
        productSlug: 'pearl-glow-nose-piece',
        productTitle: 'Pearl Glow Nose Piece',
        variantTitle: 'Default Variant',
        sku: 'HH-NOSE-001',
        priceMinor: 59900,
        currency: 'INR',
        availableQuantity: 3, // Only 3 left
        requestedQuantity: 5, // Requested 5
        effectiveQuantity: 5,
        lineTotalMinor: 299500,
        isAvailable: true
      }
    ];

    const summary = buildCartSummary(items, 'INR');

    expect(summary.items[0]?.statusNotice).toBe('quantity_reduced');
    expect(summary.items[0]?.effectiveQuantity).toBe(3);
    expect(summary.items[0]?.lineTotalMinor).toBe(3 * 59900); // 179700 paise
    expect(summary.totalQuantity).toBe(3);
    expect(summary.subtotalMinor).toBe(179700);
    expect(summary.isValidForCheckout).toBe(false); // Flags need for user confirmation
  });

  it('returns invalid checkout for empty cart', () => {
    const summary = buildCartSummary([], 'INR');

    expect(summary.totalQuantity).toBe(0);
    expect(summary.subtotalMinor).toBe(0);
    expect(summary.isValidForCheckout).toBe(false);
  });
});

describe('Cart Input Zod Validation', () => {
  it('accepts valid cart item input', () => {
    const valid = {
      variantId: '11111111-1111-1111-1111-111111111111',
      quantity: 3
    };
    expect(CartItemInputSchema.parse(valid)).toEqual(valid);
  });

  it('rejects invalid quantity (zero, negative, float, >10)', () => {
    const base = { variantId: '11111111-1111-1111-1111-111111111111' };

    expect(() => CartItemInputSchema.parse({ ...base, quantity: 0 })).toThrow();
    expect(() => CartItemInputSchema.parse({ ...base, quantity: -1 })).toThrow();
    expect(() => CartItemInputSchema.parse({ ...base, quantity: 1.5 })).toThrow();
    expect(() => CartItemInputSchema.parse({ ...base, quantity: 11 })).toThrow();
  });

  it('rejects non-uuid variantId', () => {
    expect(() =>
      CartItemInputSchema.parse({
        variantId: 'not-a-uuid',
        quantity: 1
      })
    ).toThrow();
  });

  it('rejects cart with more than 50 items', () => {
    const items = Array.from({ length: 51 }, () => ({
      variantId: '11111111-1111-1111-1111-111111111111',
      quantity: 1
    }));
    expect(() => CartValidationInputSchema.parse({ items })).toThrow();
  });
});
