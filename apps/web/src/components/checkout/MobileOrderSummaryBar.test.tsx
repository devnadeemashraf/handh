import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CartSummary } from '@hh/domain';

import { MobileOrderSummaryBar } from './MobileOrderSummaryBar';

const sampleSummary: CartSummary = {
  items: [
    {
      variantId: 'v1',
      productId: 'p1',
      productSlug: 'emerald-pin',
      productTitle: 'Emerald Nose Pin',
      variantTitle: 'Pure Silver',
      sku: 'HH-PIN-01',
      priceMinor: 49900,
      availableQuantity: 5,
      requestedQuantity: 2,
      effectiveQuantity: 2,
      lineTotalMinor: 99800,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: '/pin.jpg'
    }
  ],
  totalQuantity: 2,
  subtotalMinor: 99800,
  currency: 'INR',
  isValidForCheckout: true
};

describe('MobileOrderSummaryBar Component', () => {
  it('renders collapsed bar with piece count and total by default', () => {
    render(<MobileOrderSummaryBar cartSummary={sampleSummary} />);

    expect(screen.getByText(/Order summary/i)).toBeInTheDocument();
    expect(screen.getByText('(2 pieces)')).toBeInTheDocument();
    expect(screen.getByText('₹1,097.00')).toBeInTheDocument(); // 99800 + 9900 shipping

    // Itemized details should be collapsed initially
    expect(screen.queryByText('Emerald Nose Pin')).not.toBeInTheDocument();
  });

  it('expands to show itemized pieces and breakdown when tapped', () => {
    render(<MobileOrderSummaryBar cartSummary={sampleSummary} />);

    const toggleBtn = screen.getByRole('button', { name: /Order summary/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Emerald Nose Pin')).toBeInTheDocument();
    expect(screen.getByText(/Pure Silver ·/i)).toBeInTheDocument();
    expect(screen.getByText(/Qty: 2/i)).toBeInTheDocument();
    expect(screen.getByText('Hide order summary')).toBeInTheDocument();

    // Tap again to collapse
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('Emerald Nose Pin')).not.toBeInTheDocument();
  });
});
