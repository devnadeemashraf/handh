import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { PublicVariantItem } from '@hh/domain';

import { StickyPurchaseBar } from './StickyPurchaseBar';

const mockAddItem = vi.fn().mockResolvedValue(undefined);
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    items: [],
    openCart: vi.fn()
  })
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockAvailableVariant: PublicVariantItem = {
  id: 'var-1',
  sku: 'HH-MOD-01',
  title: 'Emerald Green',
  priceMinor: 129900,
  compareAtPriceMinor: null,
  currency: 'INR',
  isAvailable: true,
  availableQuantity: 5
};

const mockSoldOutVariant: PublicVariantItem = {
  id: 'var-2',
  sku: 'HH-MOD-02',
  title: 'Royale Gold',
  priceMinor: 149900,
  compareAtPriceMinor: null,
  currency: 'INR',
  isAvailable: false,
  availableQuantity: 0
};

describe('StickyPurchaseBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders translated down when isVisible is false and up when true', () => {
    const { rerender } = render(
      <StickyPurchaseBar
        selectedVariant={mockAvailableVariant}
        quantity={1}
        productTitle="Medina Silk"
        isVisible={false}
      />
    );

    const bar = screen.getByRole('region', { name: /Sticky Buying Bar/i });
    expect(bar.className).toContain('translate-y-full');

    rerender(
      <StickyPurchaseBar
        selectedVariant={mockAvailableVariant}
        quantity={1}
        productTitle="Medina Silk"
        isVisible={true}
      />
    );

    expect(bar.className).toContain('translate-y-0');
  });

  it('displays price formatted in INR', () => {
    render(
      <StickyPurchaseBar
        selectedVariant={mockAvailableVariant}
        quantity={1}
        productTitle="Medina Silk"
        isVisible={true}
      />
    );

    expect(screen.getByText('₹1,299.00')).toBeInTheDocument();
  });

  it('calls addItem when Add to Bag is clicked', async () => {
    render(
      <StickyPurchaseBar
        selectedVariant={mockAvailableVariant}
        quantity={2}
        productTitle="Medina Silk"
        isVisible={true}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Add to Bag/i });
    fireEvent.click(addBtn);

    expect(mockAddItem).toHaveBeenCalledWith('var-1', 2);
  });

  it('calls addItem and routes to checkout when Buy Now is clicked', async () => {
    render(
      <StickyPurchaseBar
        selectedVariant={mockAvailableVariant}
        quantity={1}
        productTitle="Medina Silk"
        isVisible={true}
      />
    );

    const buyNowBtn = screen.getByRole('button', { name: /Buy Now/i });
    fireEvent.click(buyNowBtn);

    expect(mockAddItem).toHaveBeenCalledWith('var-1', 1);
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/checkout');
    });
  });

  it('renders Notify Me button when variant is out of stock', () => {
    const onNotify = vi.fn();
    render(
      <StickyPurchaseBar
        selectedVariant={mockSoldOutVariant}
        quantity={1}
        productTitle="Medina Silk"
        isVisible={true}
        onOpenNotifyModal={onNotify}
      />
    );

    const notifyBtn = screen.getByRole('button', { name: /Notify Me When Available/i });
    expect(notifyBtn).toBeInTheDocument();
    fireEvent.click(notifyBtn);
    expect(onNotify).toHaveBeenCalled();
  });
});
