import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type { CartSummary, User } from '@hh/domain';

import { PENDING_ORDER_STORAGE_KEY, useCheckoutFlow } from './useCheckoutFlow';

describe('useCheckoutFlow Hook (E-COM-044)', () => {
  const mockUser: User = {
    id: 'user-1',
    storeId: 'store-1',
    phone: '+919876543210',
    phoneVerified: true,
    email: 'zainab@example.com',
    emailVerified: true,
    name: 'Zainab Ahmed',
    role: 'customer',
    whatsappOptIn: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockCartSummary: CartSummary = {
    items: [
      {
        variantId: '11111111-1111-1111-1111-111111111111',
        productId: '22222222-2222-2222-2222-222222222222',
        productSlug: 'silver-nose-ring',
        productTitle: 'Nose Ring',
        variantTitle: 'Silver',
        sku: 'SKU-01',
        priceMinor: 49900,
        currency: 'INR',
        availableQuantity: 5,
        requestedQuantity: 1,
        effectiveQuantity: 1,
        lineTotalMinor: 49900,
        isAvailable: true
      }
    ],
    subtotalMinor: 49900,
    currency: 'INR',
    totalQuantity: 1,
    isValidForCheckout: true
  };

  let clearCartSpy: Mock<() => void>;
  let mockClearCart: () => void;
  let mockRefreshCart: () => Promise<void>;
  let mockOpenAuthModal: (opts: {
    reason?: string;
    initialPhone?: string;
    onSuccess?: () => void;
  }) => void;

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    clearCartSpy = vi.fn<() => void>();
    mockClearCart = clearCartSpy;
    mockRefreshCart = vi.fn().mockResolvedValue(undefined);
    mockOpenAuthModal = vi.fn();

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/service-status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, serviceControl: null })
        });
      }
      if (url.includes('/api/user/addresses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, addresses: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('retains client cart and does NOT invoke clearCart upon checkout submission (E-COM-044)', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const mockCreatedOrder = {
      orderId: 'order-uuid-123',
      orderNumber: 'HH-2026-00042',
      subtotalMinor: 49900,
      shippingMinor: 0,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 49900,
      currency: 'INR',
      expiresAt: futureDate
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/service-status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, serviceControl: null })
        });
      }
      if (url.includes('/api/user/addresses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, addresses: [] })
        });
      }
      if (url.includes('/api/checkout/submit')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, order: mockCreatedOrder })
        });
      }
      if (url.includes('/api/checkout/payment-order')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              keyId: 'rzp_test_123',
              razorpayOrderId: 'order_rzp_123',
              amountMinor: 49900,
              currency: 'INR',
              orderNumber: 'HH-2026-00042'
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const { result } = renderHook(() =>
      useCheckoutFlow({
        user: mockUser,
        cartSummary: mockCartSummary,
        clearCart: mockClearCart,
        refreshCart: mockRefreshCart,
        openAuthModal: mockOpenAuthModal
      })
    );

    // Set valid address values
    act(() => {
      result.current.handleFieldChange('fullName', 'Zainab Ahmed');
      result.current.handleFieldChange('phone', '9876543210');
      result.current.handleFieldChange('email', 'zainab@example.com');
      result.current.handleFieldChange('line1', 'House 12');
      result.current.handleFieldChange('city', 'Hyderabad');
      result.current.handleFieldChange('state', 'Telangana');
      result.current.handleFieldChange('postalCode', '500001');
    });

    // Submit checkout
    await act(async () => {
      await result.current.handleSubmit();
    });

    // Crucial assertion: clearCart was NEVER invoked on submission!
    expect(clearCartSpy).not.toHaveBeenCalled();

    // Verify WhatsApp opt-in was included in submit payload (E-COM-082)
    const submitCall = (global.fetch as Mock).mock.calls.find((call) =>
      call[0].includes('/api/checkout/submit')
    );
    expect(submitCall).toBeDefined();
    const sentBody = JSON.parse(submitCall![1].body);
    expect(sentBody.whatsappOptIn).toBe(true);

    // Pending order is set in hook state
    expect(result.current.orderPlaced).toEqual(mockCreatedOrder);

    // Order is saved to sessionStorage for refresh resumption
    const stored = sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(mockCreatedOrder);
  });

  it('submits whatsappOptIn = false when customer unchecks WhatsApp updates (E-COM-082)', async () => {
    const futureDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const mockCreatedOrder = {
      orderId: 'order-uuid-optout',
      orderNumber: 'HH-2026-00043',
      subtotalMinor: 49900,
      shippingMinor: 0,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 49900,
      currency: 'INR',
      expiresAt: futureDate
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/checkout/submit')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              order: mockCreatedOrder
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, addresses: [], serviceControl: null })
      });
    });

    const { result } = renderHook(() =>
      useCheckoutFlow({
        user: mockUser,
        cartSummary: mockCartSummary,
        clearCart: mockClearCart,
        refreshCart: mockRefreshCart,
        openAuthModal: mockOpenAuthModal
      })
    );

    act(() => {
      result.current.handleFieldChange('fullName', 'Zainab Ahmed');
      result.current.handleFieldChange('phone', '9876543210');
      result.current.handleFieldChange('email', 'zainab@example.com');
      result.current.handleFieldChange('line1', 'House 12');
      result.current.handleFieldChange('city', 'Hyderabad');
      result.current.handleFieldChange('state', 'Telangana');
      result.current.handleFieldChange('postalCode', '500001');
      result.current.setWhatsappOptIn(false);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    const submitCall = (global.fetch as Mock).mock.calls.find((call) =>
      call[0].includes('/api/checkout/submit')
    );
    expect(submitCall).toBeDefined();
    const sentBody = JSON.parse(submitCall![1].body);
    expect(sentBody.whatsappOptIn).toBe(false);
  });

  it('restores pending order from sessionStorage on initial mount if reservation is active', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const savedPendingOrder = {
      orderId: 'order-uuid-saved',
      orderNumber: 'HH-2026-00099',
      subtotalMinor: 49900,
      shippingMinor: 0,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 49900,
      currency: 'INR',
      expiresAt: futureDate
    };

    sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(savedPendingOrder));

    let hookResult: { current: ReturnType<typeof useCheckoutFlow> } | undefined;
    await act(async () => {
      const { result } = renderHook(() =>
        useCheckoutFlow({
          user: mockUser,
          cartSummary: mockCartSummary,
          clearCart: mockClearCart,
          refreshCart: mockRefreshCart,
          openAuthModal: mockOpenAuthModal
        })
      );
      hookResult = result;
    });

    // Restored on mount
    expect(hookResult!.current.orderPlaced).toEqual(savedPendingOrder);
    expect(hookResult!.current.reservationRemainingSecs).toBeGreaterThan(0);
  });

  it('discards expired pending order from sessionStorage on initial mount', async () => {
    const expiredDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const expiredOrder = {
      orderId: 'order-uuid-expired',
      orderNumber: 'HH-2026-00011',
      subtotalMinor: 49900,
      shippingMinor: 0,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 49900,
      currency: 'INR',
      expiresAt: expiredDate
    };

    sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(expiredOrder));

    let hookResult: { current: ReturnType<typeof useCheckoutFlow> } | undefined;
    await act(async () => {
      const { result } = renderHook(() =>
        useCheckoutFlow({
          user: mockUser,
          cartSummary: mockCartSummary,
          clearCart: mockClearCart,
          refreshCart: mockRefreshCart,
          openAuthModal: mockOpenAuthModal
        })
      );
      hookResult = result;
    });

    // Expired order is NOT restored and is pruned from sessionStorage
    expect(hookResult!.current.orderPlaced).toBeNull();
    expect(sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toBeNull();
  });

  it('clears pending order and removes sessionStorage item when clearPendingOrder is called', async () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const savedOrder = {
      orderId: 'order-uuid-1',
      orderNumber: 'HH-2026-00001',
      subtotalMinor: 49900,
      shippingMinor: 0,
      taxMinor: 0,
      discountMinor: 0,
      totalMinor: 49900,
      currency: 'INR',
      expiresAt: futureDate
    };

    sessionStorage.setItem(PENDING_ORDER_STORAGE_KEY, JSON.stringify(savedOrder));

    let hookResult: { current: ReturnType<typeof useCheckoutFlow> } | undefined;
    await act(async () => {
      const { result } = renderHook(() =>
        useCheckoutFlow({
          user: mockUser,
          cartSummary: mockCartSummary,
          clearCart: mockClearCart,
          refreshCart: mockRefreshCart,
          openAuthModal: mockOpenAuthModal
        })
      );
      hookResult = result;
    });

    expect(hookResult!.current.orderPlaced).not.toBeNull();

    act(() => {
      hookResult!.current.clearPendingOrder();
    });

    expect(hookResult!.current.orderPlaced).toBeNull();
    expect(sessionStorage.getItem(PENDING_ORDER_STORAGE_KEY)).toBeNull();
  });

  it('sets submitError and errors.postalCode when submission returns UNSERVICEABLE_PINCODE (E-COM-063)', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/checkout/submit')) {
        return Promise.resolve({
          ok: false,
          status: 422,
          json: () =>
            Promise.resolve({
              success: false,
              code: 'UNSERVICEABLE_PINCODE',
              error: 'Delivery is currently not available to PIN 790001.'
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, addresses: [] })
      });
    });

    let hookResult: { current: ReturnType<typeof useCheckoutFlow> } | undefined;
    await act(async () => {
      const { result } = renderHook(() =>
        useCheckoutFlow({
          user: mockUser,
          cartSummary: mockCartSummary,
          clearCart: mockClearCart,
          refreshCart: mockRefreshCart,
          openAuthModal: mockOpenAuthModal
        })
      );
      hookResult = result;
    });

    await act(async () => {
      hookResult!.current.handleFieldChange('fullName', 'Fatima Begum');
      hookResult!.current.handleFieldChange('phone', '9876543210');
      hookResult!.current.handleFieldChange('email', 'fatima@example.com');
      hookResult!.current.handleFieldChange('line1', 'Jubilee Hills Road 36');
      hookResult!.current.handleFieldChange('city', 'Hyderabad');
      hookResult!.current.handleFieldChange('state', 'Telangana');
      hookResult!.current.handleFieldChange('postalCode', '790001');
    });

    await act(async () => {
      await hookResult!.current.handleSubmit();
    });

    expect(hookResult!.current.submitError).toBe(
      'Delivery is currently not available to PIN 790001.'
    );
    expect(hookResult!.current.errors.postalCode).toBe(
      'Delivery is currently not available to PIN 790001.'
    );
    expect(hookResult!.current.orderPlaced).toBeNull();
  });
});
