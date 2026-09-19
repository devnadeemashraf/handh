import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PackingSlipViewer from './PackingSlipViewer';
import type { InvoiceData } from '@hh/domain';

const mockInvoiceData: InvoiceData = {
  invoiceNumber: 'INV-HH-2026-00001',
  orderNumber: 'HH-2026-00001',
  orderDate: '2026-09-18T10:00:00Z',
  paymentStatus: 'captured',
  paymentMethod: 'prepaid_online',
  fulfillmentStatus: 'shipped',
  paymentId: 'pay_test_12345',
  customer: {
    name: 'Meera Rao',
    email: 'meera@example.com',
    phone: '+919876543210',
    address: {
      line1: 'Flat 402, Lotus Residency',
      line2: 'Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500033',
      country: 'India'
    }
  },
  items: [
    {
      title: 'Handcrafted Polki Nose Ring',
      variantTitle: '24K Gold Plated',
      sku: 'NOSE-POLKI-GLD',
      quantity: 1,
      unitPriceMinor: 89900,
      totalMinor: 89900
    },
    {
      title: 'Silk Velvet Scrunchie',
      variantTitle: 'Emerald Green',
      sku: 'SCR-EMR-01',
      quantity: 2,
      unitPriceMinor: 39900,
      totalMinor: 79800
    }
  ],
  subtotalMinor: 169700,
  deliveryFeeMinor: 0,
  discountMinor: 0,
  totalAmountMinor: 169700,
  courierName: 'DTDC Express',
  trackingNumber: 'DTDC998877',
  template: {
    brandName: 'H&H Artisanal Jewelry',
    legalName: 'H&H Luxury Atelier Pvt Ltd',
    tagline: 'Timeless Grace & Modesty',
    addressLine1: 'Banjara Hills Road No 10',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500034',
    country: 'India',
    supportEmail: 'care@hh.com',
    supportPhone: '+91 40 2345 6789',
    gstin: '36AABCH1234F1Z5',
    pan: 'AABCH1234F',
    invoicePrefix: 'INV-HH-',
    showGstBreakdown: true,
    footerNote: 'Each H&H artisanal treasure is handcrafted with reverence.'
  }
};

describe('PackingSlipViewer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders 4x6 thermal slip layout, destination address, and packing checklist', () => {
    render(<PackingSlipViewer invoiceData={mockInvoiceData} orderId="order-123" />);

    // Header & Courier badge
    expect(screen.getByText('EXPRESS DISPATCH')).toBeInTheDocument();
    expect(screen.getByText('DTDC Express')).toBeInTheDocument();

    // Tracking AWB & order info
    expect(screen.getByText('TRACKING AWB NUMBER')).toBeInTheDocument();
    expect(screen.getByText('DTDC998877')).toBeInTheDocument();
    expect(screen.getByText(/ORDER: HH-2026-00001/)).toBeInTheDocument();

    // Destination Box
    expect(screen.getByText('SHIP TO DESTINATION:')).toBeInTheDocument();
    expect(screen.getByText('Meera Rao')).toBeInTheDocument();
    expect(screen.getByText('TEL: +919876543210')).toBeInTheDocument();
    expect(screen.getByText(/Flat 402, Lotus Residency/)).toBeInTheDocument();
    expect(screen.getByText('PIN: 500033')).toBeInTheDocument();

    // Packing Checklist
    expect(screen.getByText('WORKSHOP PACKING CHECKLIST (2 ITEMS)')).toBeInTheDocument();
    expect(screen.getByText(/Handcrafted Polki Nose Ring/)).toBeInTheDocument();
    expect(screen.getByText('SKU: NOSE-POLKI-GLD')).toBeInTheDocument();
    expect(screen.getByText(/Silk Velvet Scrunchie/)).toBeInTheDocument();
    expect(screen.getByText('SKU: SCR-EMR-01')).toBeInTheDocument();

    // Return origin
    expect(screen.getByText(/RETURN ORIGIN \(IF UNDELIVERED\):/)).toBeInTheDocument();
    expect(screen.getByText(/Banjara Hills Road No 10/)).toBeInTheDocument();
  });

  it('triggers window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<PackingSlipViewer invoiceData={mockInvoiceData} orderId="order-123" />);

    const printBtn = screen.getByRole('button', { name: /print 4x6 thermal/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });
});
