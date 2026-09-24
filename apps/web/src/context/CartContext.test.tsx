import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { CartProvider, useCart } from './CartContext';

describe('CartContext (E-COM-146, E-COM-033)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('hydrates cart from localStorage and executes initial validation exactly once without duplicate calls (E-COM-146)', async () => {
    const initialItems = [{ variantId: 'var-1', quantity: 2 }];
    localStorage.setItem('hh_guest_cart', JSON.stringify(initialItems));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        cart: {
          items: [
            {
              variantId: 'var-1',
              productId: 'prod-1',
              productTitle: 'Royal Velvet Abaya',
              variantTitle: 'Midnight Black / M',
              sku: 'RVA-BLK-M',
              slug: 'royal-velvet-abaya',
              priceRupees: 8999,
              quantity: 2,
              requestedQuantity: 2,
              effectiveQuantity: 2,
              lineTotalRupees: 17998,
              isAvailable: true,
              stockAvailable: 10
            }
          ],
          subtotalRupees: 17998,
          totalQuantity: 2,
          isValidForCheckout: true
        }
      })
    });
    global.fetch = fetchMock;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    // Allow initial hydration effect to run
    await act(async () => {
      await Promise.resolve();
    });

    // Hydration should trigger exactly 1 validate call
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.totalItemCount).toBe(2);

    // Now perform an item addition
    await act(async () => {
      await result.current.addItem('var-2', 1);
    });

    // addItem runs syncItems -> validateWithServer once.
    // The hydration effect MUST NOT fire again (preventing duplicate call E-COM-146).
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reconciles local storage and state when server adjusts quantities due to stock limits (E-COM-033)', async () => {
    const initialItems = [{ variantId: 'var-limited', quantity: 5 }];
    localStorage.setItem('hh_guest_cart', JSON.stringify(initialItems));

    // Server returns stock capped at 2
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        cart: {
          items: [
            {
              variantId: 'var-limited',
              productId: 'prod-1',
              productTitle: 'Limited Silk Scarf',
              variantTitle: 'Emerald',
              sku: 'LSS-EMR',
              slug: 'limited-silk-scarf',
              priceRupees: 4500,
              quantity: 2, // Server clamped from 5 to 2
              requestedQuantity: 5,
              effectiveQuantity: 2,
              lineTotalRupees: 9000,
              isAvailable: true,
              stockAvailable: 2
            }
          ],
          subtotalRupees: 9000,
          totalQuantity: 2,
          isValidForCheckout: true
        }
      })
    });
    global.fetch = fetchMock;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CartProvider>{children}</CartProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    // Verify state items and localStorage were reconciled to server quantity
    expect(result.current.totalItemCount).toBe(2);
    expect(result.current.items).toEqual([{ variantId: 'var-limited', quantity: 2 }]);

    const storedInLocalStorage = JSON.parse(localStorage.getItem('hh_guest_cart') || '[]');
    expect(storedInLocalStorage).toEqual([{ variantId: 'var-limited', quantity: 2 }]);
  });
});
