import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { Order, OrderItem } from '@hh/db';

import { OrderConfirmationView } from './OrderConfirmationView';

const mockOrder = {
  id: 'order-12345',
  orderNumber: 'HH-2026-CONFIRM-1',
  storeId: 'store-1',
  userId: null,
  idempotencyKey: null,
  status: 'paid',
  paymentStatus: 'captured',
  fulfillmentStatus: 'unfulfilled',
  customerName: 'Amina Al-Mansoor',
  customerEmail: 'amina@example.com',
  customerPhone: '9876543210',
  shippingAddress: {
    line1: '14 Palace Gardens',
    line2: 'Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500033',
    country: 'IN'
  },
  whatsappOptIn: true,
  couponCode: 'ROYAL10',
  attribution: null,
  notes: null,
  subtotalMinor: 899000,
  shippingMinor: 0,
  discountMinor: 89900,
  totalMinor: 809100,
  taxMinor: 123420,
  cgstMinor: 61710,
  sgstMinor: 61710,
  igstMinor: 0,
  taxableAmountMinor: 685680,
  currency: 'INR',
  createdAt: new Date('2026-09-25T10:00:00Z'),
  updatedAt: new Date('2026-09-25T10:00:00Z'),
  items: [
    {
      id: 'item-1',
      orderId: 'order-12345',
      variantId: 'var-1',
      productNameSnapshot: 'Raw Silk Embroidered Kaftan',
      variantNameSnapshot: 'Midnight Navy / Size 56',
      skuSnapshot: 'KAFTAN-NAVY-56',
      unitPriceMinor: 899000,
      totalPriceMinor: 899000,
      quantity: 1
    }
  ]
} as unknown as Order & { items: OrderItem[] };

describe('OrderConfirmationView Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders restrained success greeting with customer first name', () => {
    render(<OrderConfirmationView order={mockOrder} isGuest={false} />);

    expect(screen.getByText(/Thank you, Amina\./i)).toBeInTheDocument();
    expect(
      screen.getByText(/Your order is confirmed and handcrafted with care\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Order #HH-2026-CONFIRM-1/i)).toBeInTheDocument();
  });

  it('copies order reference to clipboard when copy button is clicked', async () => {
    const clipboardSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardSpy
      }
    });

    render(<OrderConfirmationView order={mockOrder} isGuest={false} />);

    const copyBtn = screen.getByRole('button', { name: /copy order reference/i });
    await React.act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(clipboardSpy).toHaveBeenCalledWith('HH-2026-CONFIRM-1');
  });

  it('renders priority estimated delivery window and destination address', () => {
    render(<OrderConfirmationView order={mockOrder} isGuest={false} />);

    expect(screen.getByText(/Estimated Delivery Window/i)).toBeInTheDocument();
    expect(screen.getByText(/14 Palace Gardens/i)).toBeInTheDocument();
    expect(screen.getByText(/Jubilee Hills/i)).toBeInTheDocument();
    expect(screen.getByText(/500033/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact: \+91 98765 43210/i)).toBeInTheDocument();
  });

  it('renders itemized summary and financial details', () => {
    render(<OrderConfirmationView order={mockOrder} isGuest={false} />);

    expect(screen.getByText('Raw Silk Embroidered Kaftan')).toBeInTheDocument();
    expect(screen.getByText(/Midnight Navy \/ Size 56 · Qty: 1/i)).toBeInTheDocument();
    expect(screen.getByText('Discount Applied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print tax invoice/i })).toBeInTheDocument();
  });

  it('renders guest registration prompt when isGuest is true, and allows dismissal', () => {
    render(<OrderConfirmationView order={mockOrder} isGuest={true} />);

    expect(
      screen.getByText(/Save your details for faster checkout next time/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/account?claimOrder=HH-2026-CONFIRM-1'
    );

    const dismissBtn = screen.getByRole('button', { name: /maybe later/i });
    fireEvent.click(dismissBtn);

    expect(
      screen.queryByText(/Save your details for faster checkout next time/i)
    ).not.toBeInTheDocument();
  });

  it('renders tracking and continue shopping navigation actions', () => {
    render(<OrderConfirmationView order={mockOrder} isGuest={false} />);

    const trackLink = screen.getByRole('link', { name: /track your order/i });
    expect(trackLink).toHaveAttribute('href', '/track/HH-2026-CONFIRM-1');

    const shopLink = screen.getByRole('link', { name: /continue shopping/i });
    expect(shopLink).toHaveAttribute('href', '/shop');

    const contactLink = screen.getByRole('link', { name: /contact customer support/i });
    expect(contactLink).toHaveAttribute('href', '/contact?order=HH-2026-CONFIRM-1');
  });
});
