import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

import TrackingCard from './TrackingCard';

const mockShippingAddress: ShippingAddress = {
  line1: 'House 12, Road No 5',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500034',
  country: 'India'
};

const mockOrder: Order = {
  id: 'order-999',
  orderNumber: 'HH-2026-00999',
  storeId: 'store-1',
  userId: null,
  status: 'processing',
  paymentStatus: 'captured',
  fulfillmentStatus: 'shipped',
  customerName: 'Fatima Begum',
  customerEmail: 'fatima@example.com',
  customerPhone: '9848012345',
  shippingAddress: mockShippingAddress,
  couponCode: null,
  attribution: null,
  notes: null,
  subtotalMinor: 1500000,
  shippingMinor: 0,
  discountMinor: 0,
  totalMinor: 1500000,
  currency: 'INR',
  createdAt: new Date('2026-09-17T09:00:00Z'),
  updatedAt: new Date('2026-09-17T09:00:00Z')
};

const mockFulfillmentInTransit: Fulfillment = {
  id: 'fulf-transit',
  orderId: 'order-999',
  courierProvider: 'dtdc',
  trackingNumber: 'DTDC11223344',
  trackingReference: 'TRK-2026-999AA',
  status: 'shipped',
  shippingProviderId: 'trackingmore',
  labelUrl: null,
  pickupToken: null,
  latestEvent: 'Departed sorting facility in Hyderabad Hub',
  deliveredAt: null,
  rawWebhookPayload: null,
  shippedAt: new Date('2026-09-18T14:00:00Z'),
  notes: null,
  createdAt: new Date('2026-09-18T14:00:00Z'),
  updatedAt: new Date('2026-09-18T14:00:00Z')
};

const mockFulfillmentDelivered: Fulfillment = {
  ...mockFulfillmentInTransit,
  id: 'fulf-delivered',
  status: 'delivered',
  deliveredAt: new Date('2026-09-19T10:30:00Z'),
  latestEvent: 'Delivered to resident at customer doorstep'
};

describe('TrackingCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pre-dispatch View (fulfillment is null)', () => {
    it('renders workshop preparation timeline and destination details', () => {
      render(<TrackingCard fulfillment={null} order={mockOrder} />);

      expect(screen.getByText('Order Live Status')).toBeInTheDocument();
      expect(screen.getByText('HH-2026-00999')).toBeInTheDocument();
      expect(screen.getByText('Workshop Preparation & Packing')).toBeInTheDocument();
      expect(screen.getByText('Order Confirmed')).toBeInTheDocument();
      expect(screen.getByText(/Artisanal Quality Inspection & Packing/i)).toBeInTheDocument();
      expect(screen.getByText(/Courier Handover & Live Tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/Shipping to:/i)).toBeInTheDocument();
      expect(screen.getByText(/Fatima Begum/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Hyderabad/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Dispatched View (fulfillment exists)', () => {
    it('renders in-transit status, 4-stage stepper, latest courier scan, and copies AWB', async () => {
      render(<TrackingCard fulfillment={mockFulfillmentInTransit} order={mockOrder} />);

      expect(screen.getByText('Shipment Progress')).toBeInTheDocument();
      expect(screen.getByText('TRK-2026-999AA')).toBeInTheDocument();
      expect(screen.getByText('Handed to Courier (In Transit)')).toBeInTheDocument();
      expect(screen.getByText('DTDC Express')).toBeInTheDocument();
      expect(screen.getByText('DTDC11223344')).toBeInTheDocument();

      // Real-time scan callout
      expect(screen.getByText('Latest Courier Scan Update')).toBeInTheDocument();
      expect(screen.getByText('Departed sorting facility in Hyderabad Hub')).toBeInTheDocument();

      // Stepper milestones
      expect(screen.getByText('Order Confirmed & Payment Captured')).toBeInTheDocument();
      expect(screen.getByText('Handcrafted & Packed at Hyderabad Atelier')).toBeInTheDocument();
      expect(screen.getByText('In Transit with Courier Partner')).toBeInTheDocument();
      expect(screen.getByText('Final Delivery to Destination')).toBeInTheDocument();

      // Copy AWB
      const copyBtn = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('DTDC11223344');
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });

      // Official courier portal link
      const portalLink = screen.getByRole('link', {
        name: /track on official courier website/i
      });
      expect(portalLink).toHaveAttribute('href', expect.stringContaining('dtdc.in'));
    });

    it('renders delivered status and completed stepper when order is delivered', () => {
      render(<TrackingCard fulfillment={mockFulfillmentDelivered} order={mockOrder} />);

      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.getByText('Courier Transit Completed')).toBeInTheDocument();
      expect(screen.getByText('Delivered to Customer')).toBeInTheDocument();
      expect(screen.getByText(/Successfully delivered on/i)).toBeInTheDocument();
      expect(screen.getByText('Delivered to resident at customer doorstep')).toBeInTheDocument();
    });
  });
});
