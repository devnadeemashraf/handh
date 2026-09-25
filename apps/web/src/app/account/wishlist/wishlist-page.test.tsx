import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { WishlistItemWithDetails } from '@hh/domain';

import AccountWishlistPage from './page';

const mockAddItem = vi.fn().mockResolvedValue(undefined);
const mockOpenCart = vi.fn();
const mockAddToast = vi.fn();

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    toast: mockAddToast,
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

const mockWishlistInStock: WishlistItemWithDetails = {
  id: 'wish-1',
  userId: 'user-1',
  productId: 'prod-abaya-1',
  variantId: 'var-abaya-56',
  addedAt: new Date().toISOString(),
  product: {
    id: 'prod-abaya-1',
    title: 'Artisanal Raw Silk Abaya',
    slug: 'artisanal-raw-silk-abaya',
    priceMinor: 1200000,
    compareAtPriceMinor: 1500000,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-abaya.jpg',
    defaultVariantId: 'var-abaya-56',
    isAvailable: true
  }
};

const mockWishlistSoldOut: WishlistItemWithDetails = {
  id: 'wish-2',
  userId: 'user-1',
  productId: 'prod-hijab-1',
  variantId: 'var-hijab-navy',
  addedAt: new Date().toISOString(),
  product: {
    id: 'prod-hijab-1',
    title: 'Medina Silk Square Hijab',
    slug: 'medina-silk-square-hijab',
    priceMinor: 250000,
    currency: 'INR',
    imageUrl: 'https://images.unsplash.com/photo-hijab.jpg',
    defaultVariantId: 'var-hijab-navy',
    isAvailable: false
  }
};

describe('AccountWishlistPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders standard empty state when wishlist has no items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, wishlist: [] })
    });

    render(<AccountWishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Nothing saved yet')).toBeInTheDocument();
      expect(
        screen.getByText('Tap the heart on any product to save it for later.')
      ).toBeInTheDocument();
    });

    const exploreLink = screen.getByRole('link', { name: /explore the collection/i });
    expect(exploreLink).toHaveAttribute('href', '/shop');
  });

  it('renders wishlisted items with persistent Add to Bag and filled heart', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, wishlist: [mockWishlistInStock] })
    });

    render(<AccountWishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Artisanal Raw Silk Abaya')).toBeInTheDocument();
      expect(screen.getByText('1 piece saved')).toBeInTheDocument();
    });

    // Check persistent Add to Bag button
    const addToBagBtn = screen.getByRole('button', { name: /add to bag/i });
    expect(addToBagBtn).toBeInTheDocument();

    // Check remove heart button
    const removeBtn = screen.getByRole('button', {
      name: /remove artisanal raw silk abaya from wishlist/i
    });
    expect(removeBtn).toBeInTheDocument();
  });

  it('adds item directly to cart and opens cart drawer on Add to Bag click', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, wishlist: [mockWishlistInStock] })
    });

    render(<AccountWishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Artisanal Raw Silk Abaya')).toBeInTheDocument();
    });

    const addToBagBtn = screen.getByRole('button', { name: /add to bag/i });
    fireEvent.click(addToBagBtn);

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith('var-abaya-56', 1);
      expect(mockOpenCart).toHaveBeenCalled();
    });
  });

  it('renders Sold Out badge and Notify Me button for out-of-stock items', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, wishlist: [mockWishlistSoldOut] })
    });

    render(<AccountWishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Medina Silk Square Hijab')).toBeInTheDocument();
      expect(screen.getByText('Sold Out')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /notify me/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to bag/i })).not.toBeInTheDocument();
  });

  it('removes item optimistically and triggers undo toast on heart click', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/user/wishlist/prod-abaya-1')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, wishlist: [mockWishlistInStock] })
      });
    });

    render(<AccountWishlistPage />);

    await waitFor(() => {
      expect(screen.getByText('Artisanal Raw Silk Abaya')).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole('button', {
      name: /remove artisanal raw silk abaya from wishlist/i
    });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Artisanal Raw Silk Abaya')).not.toBeInTheDocument();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Removed from wishlist'
        })
      );
    });
  });
});
