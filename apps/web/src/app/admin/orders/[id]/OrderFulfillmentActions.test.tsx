import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

import OrderFulfillmentActions from './OrderFulfillmentActions';

const mockShippingAddress: ShippingAddress = {
  line1: 'Flat 402, Lotus Residency',
  line2: 'Jubilee Hills',
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500033',
  country: 'India'
};

const mockOrder: Order & { shippingAddress: ShippingAddress } = {
  id: 'order-123',
  orderNumber: 'HH-2026-00123',
  storeId: 'store-1',
  userId: null,
  status: 'paid',
  paymentStatus: 'captured',
  fulfillmentStatus: 'unfulfilled',
  customerName: 'Meera Rao',
  customerEmail: 'meera@example.com',
  customerPhone: '+919876543210',
  shippingAddress: mockShippingAddress,
  couponCode: null,
  attribution: null,
  notes: null,
  subtotalMinor: 850000,
  shippingMinor: 0,
  discountMinor: 0,
  totalMinor: 850000,
  currency: 'INR',
  createdAt: new Date('2026-09-18T10:00:00Z'),
  updatedAt: new Date('2026-09-18T10:00:00Z')
};

const mockInitialFulfillment: Fulfillment = {
  id: 'fulf-1',
  orderId: 'order-123',
  courierProvider: 'dtdc',
  trackingNumber: 'DTDC998877',
  trackingReference: 'TRK-2026-ABCDE',
  status: 'shipped',
  shippingProviderId: 'trackingmore',
  labelUrl: 'https://shiprocket.co/mock-label/DTDC998877.pdf',
  pickupToken: 'TOKEN-9988',
  latestEvent: 'Out with delivery associate in Jubilee Hills',
  deliveredAt: null,
  rawWebhookPayload: null,
  shippedAt: new Date('2026-09-18T11:00:00Z'),
  notes: 'Package sealed in gold box',
  createdAt: new Date('2026-09-18T11:00:00Z'),
  updatedAt: new Date('2026-09-18T11:00:00Z')
};

describe('OrderFulfillmentActions Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders customer communication links and copies address to clipboard', async () => {
    render(<OrderFulfillmentActions order={mockOrder} initialFulfillments={[]} />);

    // Customer contact info
    expect(screen.getByText('Customer Contact')).toBeInTheDocument();
    expect(screen.getByText(/Meera Rao/)).toBeInTheDocument();

    // WhatsApp link
    const waLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(waLink).toHaveAttribute('href', expect.stringContaining('wa.me/919876543210'));
    expect(waLink).toHaveAttribute('href', expect.stringContaining('HH-2026-00123'));

    // Call link
    const callLink = screen.getByRole('link', { name: /call/i });
    expect(callLink).toHaveAttribute('href', 'tel:+919876543210');

    // Copy label button
    const copyBtn = screen.getByRole('button', { name: /copy label/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Flat 402, Lotus Residency')
      );
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('renders quick action buttons for tax invoice and thermal packing slip', () => {
    render(<OrderFulfillmentActions order={mockOrder} initialFulfillments={[]} />);

    const invoiceLink = screen.getByRole('link', { name: /print tax invoice/i });
    expect(invoiceLink).toHaveAttribute('href', '/admin/orders/order-123/invoice');
    expect(invoiceLink).toHaveAttribute('target', '_blank');

    const packingSlipLink = screen.getByRole('link', { name: /thermal slip/i });
    expect(packingSlipLink).toHaveAttribute('href', '/admin/orders/order-123/packing-slip');
    expect(packingSlipLink).toHaveAttribute('target', '_blank');
  });

  it('renders existing fulfillments with label download button and live scan status', () => {
    render(
      <OrderFulfillmentActions order={mockOrder} initialFulfillments={[mockInitialFulfillment]} />
    );

    expect(screen.getByText('DTDC Express')).toBeInTheDocument();
    expect(screen.getByText('AWB: DTDC998877')).toBeInTheDocument();
    expect(screen.getByText('Pickup Token: TOKEN-9988')).toBeInTheDocument();
    expect(screen.getByText(/Out with delivery associate in Jubilee Hills/i)).toBeInTheDocument();

    // Download Label PDF button
    const labelLink = screen.getByRole('link', { name: /download label/i });
    expect(labelLink).toHaveAttribute('href', 'https://shiprocket.co/mock-label/DTDC998877.pdf');
    expect(labelLink).toHaveAttribute('target', '_blank');

    // Customer page link
    const customerPageLink = screen.getByRole('link', { name: /customer page/i });
    expect(customerPageLink).toHaveAttribute('href', '/track/TRK-2026-ABCDE');
  });

  it('submits Mode 1 doorstep courier pickup booking and handles success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fulfillment: {
          id: 'fulf-new',
          orderId: 'order-123',
          courierProvider: 'delhivery',
          trackingNumber: 'SR12345678',
          trackingReference: 'TRK-2026-XYZ99',
          status: 'shipped',
          shippingProviderId: 'shiprocket',
          labelUrl: 'https://shiprocket.co/mock-label/SR12345678.pdf',
          pickupToken: 'SR-PK-00123',
          latestEvent: null,
          deliveredAt: null,
          rawWebhookPayload: null,
          shippedAt: new Date(),
          notes: 'Doorstep pickup booked',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        order: { ...mockOrder, fulfillmentStatus: 'shipped' },
        pickupResult: {
          awb: 'SR12345678',
          courierName: 'Delhivery Surface',
          labelUrl: 'https://shiprocket.co/mock-label/SR12345678.pdf',
          pickupToken: 'SR-PK-00123'
        }
      })
    });
    global.fetch = fetchMock;

    render(<OrderFulfillmentActions order={mockOrder} initialFulfillments={[]} />);

    // Verify Origin Atelier notice is displayed
    expect(screen.getByText(/Hyderabad Atelier Dispatch Origin:/i)).toBeInTheDocument();

    // Submit Doorstep Pickup Booking
    const bookBtn = screen.getByRole('button', {
      name: /schedule doorstep pickup & generate label/i
    });
    fireEvent.click(bookBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/orders/order-123/book-pickup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerId: 'shiprocket',
            weightGrams: 200,
            lengthCm: 15,
            widthCm: 10,
            heightCm: 5
          })
        })
      );
      expect(screen.getByText(/Pickup booked! AWB:/i)).toBeInTheDocument();
      expect(screen.getByText('SR12345678')).toBeInTheDocument();
    });
  });

  it('switches to Mode 2 counter drop-off tab and records walk-in dispatch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        fulfillment: {
          id: 'fulf-counter',
          orderId: 'order-123',
          courierProvider: 'india_post',
          trackingNumber: 'EM123456789IN',
          trackingReference: 'TRK-2026-INPST',
          status: 'shipped',
          shippingProviderId: 'trackingmore',
          labelUrl: null,
          pickupToken: null,
          latestEvent: null,
          deliveredAt: null,
          rawWebhookPayload: null,
          shippedAt: new Date(),
          notes: 'Speed Post counter',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        order: { ...mockOrder, fulfillmentStatus: 'shipped' }
      })
    });
    global.fetch = fetchMock;

    render(<OrderFulfillmentActions order={mockOrder} initialFulfillments={[]} />);

    // Switch to Counter Drop-Off tab
    const counterTabBtn = screen.getByRole('button', { name: /counter drop-off/i });
    fireEvent.click(counterTabBtn);

    // Select India Post courier
    const courierSelect = screen.getByRole('combobox');
    fireEvent.change(courierSelect, { target: { value: 'india_post' } });

    // Enter Tracking Number
    const trackingInput = screen.getByPlaceholderText('e.g. DTDC12345678 or EM123456789IN');
    fireEvent.change(trackingInput, { target: { value: 'EM123456789IN' } });

    // Submit Counter Dispatch
    const submitBtn = screen.getByRole('button', {
      name: /record counter dispatch & link tracking/i
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/orders/order-123/fulfill',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courierProvider: 'india_post',
            trackingNumber: 'EM123456789IN',
            registerWithTracker: true
          })
        })
      );
      expect(screen.getByText('AWB: EM123456789IN')).toBeInTheDocument();
    });
  });

  it('transitions order status through processing and completion state machine', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;

    render(<OrderFulfillmentActions order={mockOrder} initialFulfillments={[]} />);

    // 1. Move from 'paid' to 'processing'
    const moveToProcessingBtn = screen.getByRole('button', {
      name: /move to in-preparation/i
    });
    fireEvent.click(moveToProcessingBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/orders/order-123/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' })
      });
    });

    // 2. Complete order button now visible
    const completeBtn = await screen.findByRole('button', {
      name: /mark order as delivered & completed/i
    });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/orders/order-123/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      expect(screen.getByText(/Order is fulfilled and completed./i)).toBeInTheDocument();
    });
  });
});
