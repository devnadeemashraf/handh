import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { PublicVariantItem } from '@hh/domain';

import { ProductPurchaseCard } from './ProductPurchaseCard';

const mockAddItem = vi.fn().mockResolvedValue(undefined);

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    cartSummary: null,
    isLoading: false,
    isOpen: false,
    totalItemCount: 0,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    toggleCart: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    refreshCart: vi.fn()
  })
}));

const mockVariants: PublicVariantItem[] = [
  {
    id: 'var-1',
    sku: 'HH-PIN-01',
    title: 'Emerald Green',
    priceMinor: 129900,
    compareAtPriceMinor: 159900,
    currency: 'INR',
    isAvailable: true,
    availableQuantity: 4
  },
  {
    id: 'var-2',
    sku: 'HH-PIN-02',
    title: 'Royale Gold',
    priceMinor: 149900,
    compareAtPriceMinor: null,
    currency: 'INR',
    isAvailable: false,
    availableQuantity: 0
  }
];

describe('ProductPurchaseCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders formatted price and statutory MRP (Inclusive of all taxes) disclosure', () => {
    render(<ProductPurchaseCard variants={mockVariants} productId="prod-1" />);

    expect(screen.getByText('₹1,299.00')).toBeDefined();
    expect(screen.getByText(/MRP \(Inclusive of all taxes\)/i)).toBeDefined();
    expect(screen.getByText('MRP ₹1,599.00')).toBeDefined();
  });

  it('displays real-time in-stock urgency and available quantity', () => {
    render(<ProductPurchaseCard variants={mockVariants} productId="prod-1" />);

    expect(screen.getByText(/4 pieces/i)).toBeDefined();
    expect(screen.getByText(/In Stock/i)).toBeDefined();
  });

  it('allows switching variants and updates price and stock status', () => {
    render(<ProductPurchaseCard variants={mockVariants} productId="prod-1" />);

    // Click Royale Gold variant (sold out)
    const goldVariantButton = screen.getByRole('button', { name: 'Royale Gold' });
    fireEvent.click(goldVariantButton);

    expect(screen.getByText('₹1,499.00')).toBeDefined();
    expect(screen.getByText(/Currently Sold Out/i)).toBeDefined();

    // Add to cart button should be disabled for sold out variant
    const addToCartBtn = screen.getByRole('button', { name: /Sold Out/i });
    expect(addToCartBtn.hasAttribute('disabled')).toBe(true);
  });

  it('invokes addItem when Add to Bag is clicked for available item', async () => {
    render(<ProductPurchaseCard variants={mockVariants} productId="prod-1" />);

    const addToBagButton = screen.getByRole('button', { name: /Add to Shopping Bag/i });
    fireEvent.click(addToBagButton);

    expect(mockAddItem).toHaveBeenCalledWith('var-1', 1);
  });
});
