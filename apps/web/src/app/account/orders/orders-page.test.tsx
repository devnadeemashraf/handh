import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AccountOrdersPage from './page';

describe('AccountOrdersPage Component (E-COM-044)', () => {
  const mockPendingOrder = {
    id: 'ord-pending-123',
    storeId: 'store-1',
    userId: 'user-1',
    orderNumber: 'HH-2026-PENDING',
    status: 'pending_payment',
    paymentStatus: 'unpaid',
    fulfillmentStatus: 'unfulfilled',
    totalMinor: 49900,
    subtotalMinor: 49900,
    shippingMinor: 0,
    taxMinor: 0,
    discountMinor: 0,
    currency: 'INR',
    customerName: 'Zainab Ahmed',
    customerEmail: 'zainab@example.com',
    customerPhone: '+919876543210',
    shippingAddress: {
      fullName: 'Zainab Ahmed',
      phone: '+919876543210',
      email: 'zainab@example.com',
      line1: 'House 12, Rose Lane',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500001',
      country: 'IN'
    },
    items: [
      {
        id: 'item-1',
        orderId: 'ord-pending-123',
        variantId: 'var-1',
        productNameSnapshot: 'Artisan Silver Nose Ring',
        variantNameSnapshot: '925 Silver',
        skuSnapshot: 'SKU-SILVER-01',
        unitPriceMinor: 49900,
        quantity: 1
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockShippedOrder = {
    ...mockPendingOrder,
    id: 'ord-shipped-456',
    orderNumber: 'HH-2026-SHIPPED',
    status: 'shipped',
    paymentStatus: 'captured',
    fulfillmentStatus: 'shipped'
  };

  const mockCancelledOrder = {
    ...mockPendingOrder,
    id: 'ord-cancelled-789',
    orderNumber: 'HH-2026-CANCELLED',
    status: 'cancelled',
    paymentStatus: 'unpaid'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "Pay Now" action for orders with pending_payment status (E-COM-044)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, orders: [mockPendingOrder] })
    });

    render(<AccountOrdersPage />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText('HH-2026-PENDING')).toBeInTheDocument();
    });

    // Verify "Pay Now" button is rendered
    const payNowButton = screen.getByRole('button', {
      name: /Pay Now for Order HH-2026-PENDING/i
    });
    expect(payNowButton).toBeInTheDocument();

    // Verify "Track Shipment" link is NOT rendered for pending order
    expect(screen.queryByText('Track Shipment')).not.toBeInTheDocument();
  });

  it('renders "Track Shipment" for shipped orders instead of "Pay Now"', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, orders: [mockShippedOrder] })
    });

    render(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('HH-2026-SHIPPED')).toBeInTheDocument();
    });

    // "Track Shipment" link must be present
    expect(screen.getByRole('link', { name: /Track Shipment/i })).toBeInTheDocument();

    // "Pay Now" button must NOT be present
    expect(screen.queryByRole('button', { name: /Pay Now/i })).not.toBeInTheDocument();
  });

  it('renders neither "Pay Now" nor "Track Shipment" for cancelled orders', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, orders: [mockCancelledOrder] })
    });

    render(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('HH-2026-CANCELLED')).toBeInTheDocument();
    });

    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay Now/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Track Shipment/i })).not.toBeInTheDocument();
  });

  it('initiates payment initialization when "Pay Now" is clicked', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/user/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, orders: [mockPendingOrder] })
        });
      }
      if (url.includes('/api/checkout/payment-order')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              keyId: 'rzp_test_123',
              razorpayOrderId: 'order_rzp_paynow_123',
              amountMinor: 49900,
              currency: 'INR',
              orderNumber: 'HH-2026-PENDING'
            })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    render(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('HH-2026-PENDING')).toBeInTheDocument();
    });

    const payNowBtn = screen.getByRole('button', {
      name: /Pay Now for Order HH-2026-PENDING/i
    });
    fireEvent.click(payNowBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/checkout/payment-order',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ orderId: mockPendingOrder.id })
        })
      );
    });
  });
});
