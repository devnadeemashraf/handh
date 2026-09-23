import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { CartSummary } from '@hh/domain';

import { OrderReviewCard } from './OrderReviewCard';

const mockCartSummary: CartSummary = {
  items: [
    {
      variantId: 'var-1',
      productId: 'prod-1',
      productSlug: 'heritage-silver-jhumka',
      productTitle: 'Heritage Silver Jhumka',
      variantTitle: 'Pure Silver',
      sku: 'HH-JHM-01',
      priceMinor: 118000, // ₹1,180.00
      requestedQuantity: 1,
      effectiveQuantity: 1,
      availableQuantity: 5,
      lineTotalMinor: 118000,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: null
    }
  ],
  totalQuantity: 1,
  subtotalMinor: 118000,
  currency: 'INR',
  isValidForCheckout: true
};

const mockCartSummaryBelowThreshold: CartSummary = {
  items: [
    {
      variantId: 'var-2',
      productId: 'prod-2',
      productSlug: 'minimalist-nose-pin',
      productTitle: 'Minimalist Nose Pin',
      variantTitle: 'Silver',
      sku: 'HH-PIN-01',
      priceMinor: 59900, // ₹599.00 (< ₹999 threshold)
      requestedQuantity: 1,
      effectiveQuantity: 1,
      availableQuantity: 3,
      lineTotalMinor: 59900,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: null
    }
  ],
  totalQuantity: 1,
  subtotalMinor: 59900,
  currency: 'INR',
  isValidForCheckout: true
};

describe('OrderReviewCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders order summary with free delivery for orders above threshold', () => {
    const onSubmit = vi.fn();
    render(
      <OrderReviewCard cartSummary={mockCartSummary} isSubmitting={false} onSubmit={onSubmit} />
    );

    expect(screen.getByText('Order Summary (1 piece)')).toBeInTheDocument();
    expect(screen.getAllByText('₹1,180.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('charges standard courier fee when subtotal is below free delivery threshold', () => {
    const onSubmit = vi.fn();
    render(
      <OrderReviewCard
        cartSummary={mockCartSummaryBelowThreshold}
        isSubmitting={false}
        onSubmit={onSubmit}
      />
    );

    // Shipping fee of ₹99.00
    expect(screen.getByText('₹99.00')).toBeInTheDocument();
    // Total: ₹599 + ₹99 = ₹698.00
    expect(screen.getByText('₹698.00')).toBeInTheDocument();
  });

  it('displays intra-state CGST (9%) and SGST (9%) breakdown for Telangana destination', () => {
    const onSubmit = vi.fn();
    render(
      <OrderReviewCard
        cartSummary={mockCartSummary}
        isSubmitting={false}
        onSubmit={onSubmit}
        destinationState="Telangana"
      />
    );

    const gstBreakdown = screen.getByTestId('gst-breakdown');
    expect(gstBreakdown).toBeInTheDocument();
    expect(screen.getByText(/Statutory GST Included \(18%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Taxable Amount/i)).toBeInTheDocument();
    expect(screen.getByText(/CGST \(9%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/SGST \(9%\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/IGST/i)).not.toBeInTheDocument();
  });

  it('displays inter-state IGST (18%) breakdown when destination is outside Telangana', () => {
    const onSubmit = vi.fn();
    render(
      <OrderReviewCard
        cartSummary={mockCartSummary}
        isSubmitting={false}
        onSubmit={onSubmit}
        destinationState="Maharashtra"
      />
    );

    const gstBreakdown = screen.getByTestId('gst-breakdown');
    expect(gstBreakdown).toBeInTheDocument();
    expect(screen.getByText(/Statutory GST Included \(18%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/IGST \(18%\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/CGST/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SGST/i)).not.toBeInTheDocument();
  });

  it('applies promotional coupon code and shows discount row', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        valid: true,
        discountMinor: 10000, // ₹100 discount
        coupon: { code: 'WELCOME10' }
      })
    });
    global.fetch = fetchMock;

    const onSubmit = vi.fn();
    render(
      <OrderReviewCard
        cartSummary={mockCartSummary}
        isSubmitting={false}
        onSubmit={onSubmit}
        destinationState="Telangana"
      />
    );

    const couponInput = screen.getByPlaceholderText(/PROMO CODE/i);
    fireEvent.change(couponInput, { target: { value: 'WELCOME10' } });

    const applyBtn = screen.getByRole('button', { name: /Apply/i });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText('WELCOME10 applied')).toBeInTheDocument();
      expect(screen.getByText(/Coupon Discount \(WELCOME10\)/i)).toBeInTheDocument();
    });
  });

  it('calls onSubmit callback when primary checkout button is clicked', () => {
    const onSubmit = vi.fn();
    render(
      <OrderReviewCard cartSummary={mockCartSummary} isSubmitting={false} onSubmit={onSubmit} />
    );

    const proceedBtn = screen.getByRole('button', { name: /Place Order & Proceed to Pay/i });
    fireEvent.click(proceedBtn);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
