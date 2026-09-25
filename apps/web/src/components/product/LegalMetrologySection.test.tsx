import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DEFAULT_BRAND_IDENTITY, type PublicProductDetail } from '@hh/domain';

import { LegalMetrologySection } from './LegalMetrologySection';

const mockProduct: PublicProductDetail = {
  id: 'prod-001',
  slug: 'emerald-abaya-pin',
  title: 'Royale Emerald Abaya Pin',
  description: 'Handcrafted emerald modesty pin.',
  department: 'women',
  currency: 'INR',
  isCustomizable: false,
  countryOfOrigin: 'India',
  netQuantity: '1 N',
  commodityName: 'Modest Wear Hijab Pin',
  manufacturerDetails: {
    name: DEFAULT_BRAND_IDENTITY.legalName,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted,
    email: DEFAULT_BRAND_IDENTITY.supportEmail,
    phone: DEFAULT_BRAND_IDENTITY.supportPhone
  },
  packerDetails: {
    name: `${DEFAULT_BRAND_IDENTITY.name} Packaging Facility`,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted
  },
  consumerCareDetails: {
    email: DEFAULT_BRAND_IDENTITY.supportEmail,
    phone: DEFAULT_BRAND_IDENTITY.supportPhone,
    address: DEFAULT_BRAND_IDENTITY.address.fullFormatted
  },
  category: {
    id: 'cat-01',
    slug: 'jewelry',
    name: 'Jewelry'
  },
  variants: [
    {
      id: 'var-01',
      sku: 'HH-PIN-EM-01',
      title: 'Standard',
      priceMinor: 129900,
      compareAtPriceMinor: 159900,
      currency: 'INR',
      isAvailable: true,
      availableQuantity: 5
    }
  ],
  images: [
    {
      id: 'img-01',
      url: 'https://images.handh.local/pin-01.jpg',
      altText: 'Royale Emerald Pin',
      sortOrder: 0
    }
  ],
  seo: {
    title: 'Royale Emerald Pin',
    description: 'Emerald Pin'
  }
};

describe('LegalMetrologySection Component', () => {
  it('renders statutory Legal Metrology heading and Rule 6 disclosure badge', () => {
    render(<LegalMetrologySection product={mockProduct} />);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Legal Metrology Declarations' })
    ).toBeDefined();
    expect(
      screen.getByText(/Rule 6, Legal Metrology \(Packaged Commodities\) Rules, 2011/i)
    ).toBeDefined();
  });

  it('renders mandatory commodity name, net quantity, and country of origin', () => {
    render(<LegalMetrologySection product={mockProduct} />);

    expect(screen.getByText('Modest Wear Hijab Pin')).toBeDefined();
    expect(screen.getByText('1 N')).toBeDefined();
    expect(screen.getByText('India')).toBeDefined();
  });

  it('renders MRP explicitly labeled with tax disclosure', () => {
    render(<LegalMetrologySection product={mockProduct} />);

    expect(screen.getByText(/₹1,299\.00 \(Inclusive of all taxes\)/i)).toBeDefined();
  });

  it('renders manufacturer and packer corporate details', () => {
    render(<LegalMetrologySection product={mockProduct} />);

    expect(screen.getByText(DEFAULT_BRAND_IDENTITY.legalName)).toBeDefined();
    expect(screen.getByText(`${DEFAULT_BRAND_IDENTITY.name} Packaging Facility`)).toBeDefined();
    expect(
      screen.getAllByText(DEFAULT_BRAND_IDENTITY.address.fullFormatted).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('renders consumer care coordinates and links to /grievance', () => {
    render(<LegalMetrologySection product={mockProduct} />);

    expect(screen.getByText(DEFAULT_BRAND_IDENTITY.supportEmail)).toBeDefined();
    expect(screen.getByText(DEFAULT_BRAND_IDENTITY.supportPhone)).toBeDefined();

    const grievanceLink = screen.getByRole('link', { name: /File Grievance Ticket/i });
    expect(grievanceLink.getAttribute('href')).toBe('/grievance');
  });
});
