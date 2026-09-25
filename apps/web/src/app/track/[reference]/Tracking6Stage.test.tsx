import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

import TrackingCard from './TrackingCard';

const mockAddress: ShippingAddress = {
  line1: 'Bespoke Villa 7',
  line2: 'Banjara Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500034',
  country: 'India'
};

const mockOrder: Order = {
  id: 'order-101',
  orderNumber: 'HH-2026-STAGE',
  storeId: 'store-1',
  userId: 'user-1',
  idempotencyKey: null,
  status: 'processing',
  paymentStatus: 'captured',
  fulfillmentStatus: 'shipped',
  customerName: 'Samira Khan',
  customerEmail: 'samira@example.com',
  customerPhone: '9848011223',
  shippingAddress: mockAddress,
  whatsappOptIn: true,
  couponCode: null,
  attribution: null,
  notes: null,
  subtotalMinor: 1200000,
  shippingMinor: 0,
  discountMinor: 0,
  totalMinor: 1200000,
  taxMinor: 183050,
  cgstMinor: 91525,
  sgstMinor: 91525,
  igstMinor: 0,
  taxableAmountMinor: 1016950,
  currency: 'INR',
  createdAt: new Date('2026-09-20T10:00:00Z'),
  updatedAt: new Date('2026-09-20T10:00:00Z')
};

const mockFulfillmentTransit: Fulfillment = {
  id: 'fulf-transit-101',
  orderId: 'order-101',
  courierProvider: 'delhivery',
  trackingNumber: 'DEL12345678',
  trackingReference: 'TRK-2026-STAGE-DEL',
  status: 'shipped',
  shippingProviderId: 'trackingmore',
  labelUrl: null,
  pickupToken: null,
  latestEvent: 'Out for local delivery via Delhivery Hub',
  deliveredAt: null,
  rawWebhookPayload: null,
  shippedAt: new Date('2026-09-21T12:00:00Z'),
  notes: null,
  createdAt: new Date('2026-09-21T12:00:00Z'),
  updatedAt: new Date('2026-09-21T12:00:00Z')
};

const mockFulfillmentDelivered: Fulfillment = {
  ...mockFulfillmentTransit,
  id: 'fulf-delivered-101',
  status: 'delivered',
  deliveredAt: new Date('2026-09-22T16:00:00Z'),
  latestEvent: 'Delivered to resident at customer doorstep'
};

describe('TrackingCard 6-Stage Visual Stepper & Features', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders pre-dispatch workshop stages with contact support action', () => {
    render(<TrackingCard fulfillment={null} order={mockOrder} />);

    expect(screen.getByText('Order Live Status')).toBeInTheDocument();
    expect(screen.getByText('Workshop Preparation & Packing')).toBeInTheDocument();

    const supportLink = screen.getByRole('link', { name: /contact support/i });
    expect(supportLink).toHaveAttribute('href', '/contact?order=HH-2026-STAGE');
  });

  it('renders in-transit courier view with collapsible order and delivery summary', () => {
    render(<TrackingCard fulfillment={mockFulfillmentTransit} order={mockOrder} />);

    expect(screen.getByText('Shipment Progress')).toBeInTheDocument();
    expect(screen.getByText('Out for local delivery via Delhivery Hub')).toBeInTheDocument();

    // Toggle Order & Delivery Summary accordion
    const summaryBtn = screen.getByRole('button', { name: /order & delivery summary/i });
    expect(screen.queryByText(/Bespoke Villa 7/i)).not.toBeInTheDocument();

    fireEvent.click(summaryBtn);
    expect(screen.getByText(/Bespoke Villa 7/i)).toBeInTheDocument();
    expect(screen.getByText(/Banjara Hills/i)).toBeInTheDocument();
  });

  it('renders return/exchange action when order is delivered', () => {
    render(<TrackingCard fulfillment={mockFulfillmentDelivered} order={mockOrder} />);

    const returnLink = screen.getByRole('link', { name: /request return \/ exchange/i });
    expect(returnLink).toHaveAttribute('href', '/returns');
  });
});
