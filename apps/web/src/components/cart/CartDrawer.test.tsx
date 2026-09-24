import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CartSummary } from '@hh/domain';

import { CartDrawer } from './CartDrawer';

const mockCloseCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockRemoveItem = vi.fn();

const defaultCartContext = {
  isOpen: true,
  closeCart: mockCloseCart,
  cartSummary: null as CartSummary | null,
  totalItemCount: 0,
  updateQuantity: mockUpdateQuantity,
  removeItem: mockRemoveItem,
  isLoading: false,
  items: [],
  openCart: vi.fn(),
  toggleCart: vi.fn(),
  clearCart: vi.fn(),
  refreshCart: vi.fn(),
  addItem: vi.fn()
};

let currentCartContext = { ...defaultCartContext };
let currentServiceState = {
  serviceControl: null,
  isServicePaused: false
};

vi.mock('@/context/CartContext', () => ({
  useCart: () => currentCartContext
}));

vi.mock('./useCartDrawerService', () => ({
  useCartDrawerService: () => currentServiceState
}));

const sampleCartSummary: CartSummary = {
  items: [
    {
      variantId: 'var-1',
      productId: 'prod-1',
      productSlug: 'vintage-filigree-ring',
      productTitle: 'Vintage Filigree Ring',
      variantTitle: 'Antiqued Gold',
      sku: 'HH-ACC-RNG-01',
      priceMinor: 129900,
      availableQuantity: 5,
      requestedQuantity: 2,
      effectiveQuantity: 2,
      lineTotalMinor: 259800,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: '/images/products/ring.jpg'
    },
    {
      variantId: 'var-2',
      productId: 'prod-2',
      productSlug: 'heritage-silver-jhumka',
      productTitle: 'Heritage Silver Jhumka',
      variantTitle: 'Pure Silver',
      sku: 'HH-ACC-JHM-02',
      priceMinor: 89900,
      availableQuantity: 3,
      requestedQuantity: 1,
      effectiveQuantity: 1,
      lineTotalMinor: 89900,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: null
    }
  ],
  totalQuantity: 3,
  subtotalMinor: 349700,
  currency: 'INR',
  isValidForCheckout: true
};

describe('CartDrawer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentCartContext = { ...defaultCartContext };
    currentServiceState = {
      serviceControl: null,
      isServicePaused: false
    };
  });

  it('renders empty bag state with explore collection CTA when cart is empty', () => {
    currentCartContext.cartSummary = null;
    currentCartContext.totalItemCount = 0;

    render(<CartDrawer />);

    expect(screen.getByText('Your Bag is Empty')).toBeInTheDocument();
    expect(screen.getByText(/Discover our signature modest wear accessories/i)).toBeInTheDocument();

    const exploreButton = screen.getByRole('button', { name: /Explore Collection/i });
    expect(exploreButton).toBeInTheDocument();

    fireEvent.click(exploreButton);
    expect(mockCloseCart).toHaveBeenCalledTimes(1);
  });

  it('renders line items with product titles, variant titles, prices, and subtotal', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;

    render(<CartDrawer />);

    expect(screen.getByText('Vintage Filigree Ring')).toBeInTheDocument();
    expect(screen.getByText('Antiqued Gold')).toBeInTheDocument();
    expect(screen.getByText('Heritage Silver Jhumka')).toBeInTheDocument();
    expect(screen.getByText('Pure Silver')).toBeInTheDocument();

    // Line totals
    expect(screen.getByText('₹2,598.00')).toBeInTheDocument();
    expect(screen.getByText('₹899.00')).toBeInTheDocument();

    // Footer Subtotal (₹3,497.00)
    expect(screen.getByText('₹3,497.00')).toBeInTheDocument();
  });

  it('dispatches updateQuantity when quantity increment button (+) is clicked', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;

    render(<CartDrawer />);

    const incrementButtons = screen.getAllByRole('button', { name: /Increase quantity/i });
    expect(incrementButtons.length).toBe(2);

    const firstIncBtn = incrementButtons[0];
    expect(firstIncBtn).toBeDefined();
    fireEvent.click(firstIncBtn!);
    // Current quantity is 2, incrementing to 3
    expect(mockUpdateQuantity).toHaveBeenCalledWith('var-1', 3);
  });

  it('dispatches updateQuantity when quantity decrement button (-) is clicked', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;

    render(<CartDrawer />);

    const decrementButtons = screen.getAllByRole('button', { name: /Decrease quantity/i });
    expect(decrementButtons.length).toBe(2);

    const firstDecBtn = decrementButtons[0];
    expect(firstDecBtn).toBeDefined();
    fireEvent.click(firstDecBtn!);
    // Current quantity is 2, decrementing to 1
    expect(mockUpdateQuantity).toHaveBeenCalledWith('var-1', 1);
  });

  it('dispatches removeItem when trash remove button is clicked', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;

    render(<CartDrawer />);

    const removeButtons = screen.getAllByRole('button', { name: /Remove item/i });
    expect(removeButtons.length).toBe(2);

    const firstRemoveBtn = removeButtons[0];
    expect(firstRemoveBtn).toBeDefined();
    fireEvent.click(firstRemoveBtn!);
    expect(mockRemoveItem).toHaveBeenCalledWith('var-1');
  });

  it('renders maintenance announcement banner and disables checkout when service is paused', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;
    currentServiceState = {
      isServicePaused: true,
      serviceControl: {
        operatingStatus: 'maintenance',
        checkoutEnabled: false,
        paymentsEnabled: false,
        headline: 'System Maintenance in Progress',
        maintenanceNotice: 'Checkout is temporarily disabled while we upgrade payment systems.'
      } as unknown as null
    };

    render(<CartDrawer />);

    expect(screen.getByText('System Maintenance in Progress')).toBeInTheDocument();
    expect(
      screen.getByText('Checkout is temporarily disabled while we upgrade payment systems.')
    ).toBeInTheDocument();

    const checkoutLink = screen.getByRole('link', {
      name: /Checkout Temporarily Paused/i
    });
    expect(checkoutLink).toBeInTheDocument();
  });

  it('navigates to checkout and closes cart when checkout button is clicked in ready state', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;

    render(<CartDrawer />);

    const checkoutLink = screen.getByRole('link', { name: /Proceed to Checkout/i });
    expect(checkoutLink).toHaveAttribute('href', '/checkout');

    fireEvent.click(checkoutLink);
    expect(mockCloseCart).toHaveBeenCalledTimes(1);
  });

  it('disables quantity and remove controls when cart is in loading state', () => {
    currentCartContext.cartSummary = sampleCartSummary;
    currentCartContext.totalItemCount = 3;
    currentCartContext.isLoading = true;

    render(<CartDrawer />);

    const incrementButtons = screen.getAllByRole('button', { name: /Increase quantity/i });
    incrementButtons.forEach((btn) => expect(btn).toBeDisabled());

    const removeButtons = screen.getAllByRole('button', { name: /Remove item/i });
    removeButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
