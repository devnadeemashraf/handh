import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { InvoiceData } from '@hh/domain';

import InvoiceViewer from './InvoiceViewer';

const mockInvoiceData: InvoiceData = {
  invoiceNumber: 'INV-HH-2026-00001',
  orderNumber: 'HH-2026-00001',
  orderDate: '2026-09-18T10:00:00Z',
  paymentStatus: 'captured',
  paymentMethod: 'prepaid_online',
  fulfillmentStatus: 'shipped',
  paymentId: 'pay_test_12345',
  customer: {
    name: 'Amina Begum',
    email: 'amina@example.com',
    phone: '+919876543210',
    address: {
      line1: 'Banjara Hills, Road No. 12',
      line2: 'Apartment 4B',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
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
  discountMinor: 10000,
  totalAmountMinor: 159700,
  taxMinor: 24361,
  taxableAmountMinor: 135339,
  cgstMinor: 12180,
  sgstMinor: 12181,
  igstMinor: 0,
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

describe('InvoiceViewer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders invoice header, brand details, customer address, and items correctly', () => {
    render(<InvoiceViewer initialInvoiceData={mockInvoiceData} orderId="order-123" />);

    // Brand and tax details
    expect(
      screen.getByRole('heading', { level: 1, name: 'H&H Artisanal Jewelry' })
    ).toBeInTheDocument();
    expect(screen.getByText('H&H Luxury Atelier Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByText(/GSTIN: 36AABCH1234F1Z5/)).toBeInTheDocument();
    expect(screen.getByText(/care@hh.com/)).toBeInTheDocument();

    // Invoice meta
    expect(screen.getByText('INV-HH-2026-00001')).toBeInTheDocument();
    expect(screen.getByText('HH-2026-00001')).toBeInTheDocument();

    // Customer & destination
    expect(screen.getByText('Amina Begum')).toBeInTheDocument();
    expect(screen.getByText('+919876543210')).toBeInTheDocument();
    expect(screen.getByText(/Road No\. 12/)).toBeInTheDocument();
    expect(screen.getByText('500034')).toBeInTheDocument();

    // Items
    expect(screen.getByText('Handcrafted Polki Nose Ring')).toBeInTheDocument();
    expect(screen.getByText('NOSE-POLKI-GLD')).toBeInTheDocument();
    expect(screen.getByText('Silk Velvet Scrunchie')).toBeInTheDocument();
    expect(screen.getByText('SCR-EMR-01')).toBeInTheDocument();

    // Financial breakdown
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
    expect(screen.getByText('Discount Applied')).toBeInTheDocument();
  });

  it('renders statutory GST tax breakdown when available', () => {
    render(<InvoiceViewer initialInvoiceData={mockInvoiceData} orderId="order-123" />);

    expect(screen.getByTestId('invoice-gst-breakdown')).toBeInTheDocument();
    expect(screen.getByText('Taxable Base Value')).toBeInTheDocument();
    expect(screen.getByText('CGST (9%)')).toBeInTheDocument();
    expect(screen.getByText('SGST (9%)')).toBeInTheDocument();
    expect(screen.getByText('Total GST Included')).toBeInTheDocument();
  });

  it('triggers window.print when print button is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<InvoiceViewer initialInvoiceData={mockInvoiceData} orderId="order-123" />);

    const printBtn = screen.getByRole('button', { name: /print \/ save pdf/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('opens customize template modal and applies updated template info', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        template: {
          ...mockInvoiceData.template,
          brandName: 'H&H Haute Couture'
        }
      })
    });
    global.fetch = fetchMock;

    render(<InvoiceViewer initialInvoiceData={mockInvoiceData} orderId="order-123" />);

    // Open customizer modal
    const customizeBtn = screen.getByRole('button', { name: /customize template/i });
    fireEvent.click(customizeBtn);

    expect(screen.getByText('Customize Invoice Template')).toBeInTheDocument();

    // Change brand name input
    const brandInput = screen.getByDisplayValue('H&H Artisanal Jewelry');
    fireEvent.change(brandInput, { target: { value: 'H&H Haute Couture' } });

    // Submit modal form
    const saveBtn = screen.getByRole('button', { name: /save template/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/settings/invoice',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('H&H Haute Couture')
        })
      );
      // The invoice header should now reflect the updated brand name
      expect(
        screen.getByRole('heading', { level: 1, name: 'H&H Haute Couture' })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Customize Invoice Template')).not.toBeInTheDocument();
    });
  });
});
