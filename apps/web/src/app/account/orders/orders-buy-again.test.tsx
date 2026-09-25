import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AccountOrdersPage from './page';

const mockAddItem = vi.fn().mockResolvedValue(undefined);
const mockOpenCart = vi.fn();

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
    toasts: []
  })
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
    items: [],
    cartSummary: null,
    isLoading: false,
    isOpen: false,
    totalItemCount: 0,
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn()
  })
}));

const mockOrder = {
  id: 'ord-completed-1',
  orderNumber: 'HH-2026-BUYAGAIN',
  status: 'delivered',
  paymentStatus: 'captured',
  totalMinor: 1500000,
  subtotalMinor: 1500000,
  shippingMinor: 0,
  customerName: 'Amina',
  customerEmail: 'amina@example.com',
  customerPhone: '+919876543210',
  shippingAddress: {
    line1: 'Palace Road',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500034'
  },
  items: [
    {
      id: 'item-1',
      orderId: 'ord-completed-1',
      variantId: 'var-silk-1',
      productNameSnapshot: 'Pure Silk Abaya',
      variantNameSnapshot: 'Black / Size 54',
      quantity: 2,
      unitPriceMinor: 750000,
      totalPriceMinor: 1500000
    }
  ],
  createdAt: new Date().toISOString()
};

describe('AccountOrdersPage Buy Again & Empty States', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard empty state when user has no orders', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, orders: [] })
    });

    render(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
      expect(screen.getByText('Your past orders will appear here.')).toBeInTheDocument();
    });

    const startShoppingLink = screen.getByRole('link', { name: /start shopping/i });
    expect(startShoppingLink).toHaveAttribute('href', '/shop');
  });

  it('adds items back to cart when "Buy Again" is clicked', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, orders: [mockOrder] })
    });

    render(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('HH-2026-BUYAGAIN')).toBeInTheDocument();
    });

    const buyAgainBtn = screen.getByRole('button', {
      name: /Buy Again from Order HH-2026-BUYAGAIN/i
    });
    fireEvent.click(buyAgainBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('var-silk-1', 2);
      expect(mockOpenCart).toHaveBeenCalled();
    });
  });
});
