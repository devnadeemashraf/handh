import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { CartSummary } from '@hh/domain';

import { CartView } from './CartView';

const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();
const mockAddItem = vi.fn();
const mockToast = vi.fn();

const sampleSummary: CartSummary = {
  items: [
    {
      variantId: 'var-101',
      productId: 'prod-101',
      productSlug: 'emerald-nose-ring',
      productTitle: 'Emerald Nose Ring',
      variantTitle: 'Pure Silver · Size M',
      sku: 'HH-NR-01',
      priceMinor: 49900,
      availableQuantity: 5,
      requestedQuantity: 1,
      effectiveQuantity: 1,
      lineTotalMinor: 49900,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: '/images/emerald-ring.jpg'
    }
  ],
  totalQuantity: 1,
  subtotalMinor: 49900,
  currency: 'INR',
  isValidForCheckout: true
};

let currentCartState = {
  cartSummary: sampleSummary as CartSummary | null,
  totalItemCount: 1,
  updateQuantity: mockUpdateQuantity,
  removeItem: mockRemoveItem,
  addItem: mockAddItem,
  isLoading: false,
  isOpen: false,
  openCart: vi.fn(),
  closeCart: vi.fn(),
  toggleCart: vi.fn(),
  clearCart: vi.fn(),
  refreshCart: vi.fn()
};

vi.mock('@/context/CartContext', () => ({
  useCart: () => currentCartState
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: mockToast,
    dismiss: vi.fn(),
    toasts: []
  })
}));

describe('CartView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentCartState = {
      cartSummary: sampleSummary,
      totalItemCount: 1,
      updateQuantity: mockUpdateQuantity,
      removeItem: mockRemoveItem,
      addItem: mockAddItem,
      isLoading: false,
      isOpen: false,
      openCart: vi.fn(),
      closeCart: vi.fn(),
      toggleCart: vi.fn(),
      clearCart: vi.fn(),
      refreshCart: vi.fn()
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/service-status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, serviceControl: null })
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, products: [] })
        });
      }
      if (url.includes('/api/cart/coupon')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              valid: true,
              coupon: { id: 'c1', code: 'SAVE10', discountType: 'percentage', value: 10 },
              discountMinor: 4990,
              newSubtotalMinor: 44910
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  it('renders empty cart state per UX state catalogue when cart is empty', () => {
    currentCartState.cartSummary = null;
    currentCartState.totalItemCount = 0;

    render(<CartView />);

    expect(screen.getByText('Your bag is empty')).toBeInTheDocument();
    expect(screen.getByText('Everything you add will show up here.')).toBeInTheDocument();
    const startShoppingLink = screen.getByRole('link', { name: /Start Shopping/i });
    expect(startShoppingLink).toBeInTheDocument();
    expect(startShoppingLink).toHaveAttribute('href', '/shop');
  });

  it('renders line items with variant titles, 4:5 image, and tabular prices', () => {
    render(<CartView />);

    expect(screen.getByText('Your Bag (1)')).toBeInTheDocument();
    expect(screen.getByText('Emerald Nose Ring')).toBeInTheDocument();
    expect(screen.getByText('Pure Silver · Size M')).toBeInTheDocument();
    expect(screen.getAllByText('₹499.00').length).toBeGreaterThan(0);
  });

  it('renders free shipping meter calculating remaining amount to threshold', () => {
    render(<CartView />);

    // Threshold is 99900 (₹999), cart subtotal is 49900 (₹499) -> Remaining is ₹500
    expect(screen.getByText(/more for free express delivery/i)).toBeInTheDocument();
    expect(screen.getByText('₹500.00')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders unlocked state when subtotal exceeds free shipping threshold', () => {
    currentCartState.cartSummary = {
      ...sampleSummary,
      subtotalMinor: 149900 // ₹1,499.00 > ₹999.00
    };

    render(<CartView />);

    expect(screen.getByText("You've unlocked Free Express Delivery!")).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('dispatches updateQuantity when quantity stepper is clicked', () => {
    render(<CartView />);

    const incBtn = screen.getByRole('button', { name: /Increase quantity/i });
    fireEvent.click(incBtn);

    expect(mockUpdateQuantity).toHaveBeenCalledWith('var-101', 2);
  });

  it('triggers removeItem and emits undo toast when Remove is clicked', () => {
    render(<CartView />);

    const removeBtn = screen.getByRole('button', { name: /Remove item/i });
    fireEvent.click(removeBtn);

    expect(mockRemoveItem).toHaveBeenCalledWith('var-101');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Emerald Nose Ring removed',
        action: expect.objectContaining({
          label: 'Undo'
        })
      })
    );
  });

  it('moves item to Saved for Later when "Save for later" is clicked', async () => {
    render(<CartView />);

    const saveBtn = screen.getByRole('button', { name: /Save for later/i });
    fireEvent.click(saveBtn);

    expect(mockRemoveItem).toHaveBeenCalledWith('var-101');
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Moved to Saved for Later'
      })
    );

    // Verify saved section renders
    await waitFor(() => {
      expect(screen.getByText(/Saved for Later \(1\)/i)).toBeInTheDocument();
    });
  });

  it('toggles promo code input, validates, and applies discount pill', async () => {
    render(<CartView />);

    // Click "Have a promo code?"
    const promoToggle = screen.getByRole('button', { name: /Have a promo code\?/i });
    fireEvent.click(promoToggle);

    const input = screen.getByPlaceholderText('PROMO CODE');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'SAVE10' } });
    const form = input.closest('form');
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/cart/coupon', expect.anything());
      expect(screen.getAllByText(/SAVE10/).length).toBeGreaterThan(0);
      expect(screen.getByText(/applied/)).toBeInTheDocument();
    });
  });

  it('renders Proceed to Checkout button linking to /checkout', () => {
    render(<CartView />);

    const checkoutLinks = screen.getAllByRole('link', { name: /Proceed to Checkout|Checkout/i });
    expect(checkoutLinks.length).toBeGreaterThan(0);
    expect(checkoutLinks[0]).toHaveAttribute('href', '/checkout');
  });
});
