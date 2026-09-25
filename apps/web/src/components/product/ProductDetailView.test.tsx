import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { PublicProductDetail, PublicProductListItem } from '@hh/domain';

import { ProductDetailView } from './ProductDetailView';

// Mock intersection observer
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
window.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: vi.fn(),
  disconnect: mockDisconnect
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: vi.fn().mockResolvedValue(undefined),
    items: [],
    openCart: vi.fn()
  })
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    openAuthModal: vi.fn()
  })
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

const mockProduct: PublicProductDetail = {
  id: 'prod-pdp-1',
  slug: 'royal-emerald-abaya',
  title: 'Royal Emerald Abaya',
  description: 'Pure artisanal drape woven from fine medina silk.',
  currency: 'INR',
  countryOfOrigin: 'India',
  netQuantity: '1 N',
  manufacturerDetails: { name: 'H&H Brand', address: 'Bangalore' },
  category: { id: 'cat-1', slug: 'abayas', name: 'Abayas' },
  variants: [
    {
      id: 'var-1',
      sku: 'HH-ABY-01',
      title: 'Emerald Green',
      priceMinor: 299900,
      compareAtPriceMinor: 349900,
      currency: 'INR',
      isAvailable: true,
      availableQuantity: 4
    }
  ],
  images: [
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1',
      altText: 'Front View',
      sortOrder: 1
    }
  ],
  seo: { title: null, description: null },
  tags: ['new', 'modest']
};

const mockCatalog: PublicProductListItem[] = [
  {
    id: 'prod-rec-1',
    slug: 'silk-chiffon-hijab',
    title: 'Silk Chiffon Hijab',
    startingPriceMinor: 89900,
    currency: 'INR',
    primaryImageUrl: 'https://images.unsplash.com/photo-2',
    categoryName: 'Hijabs',
    isAvailable: true,
    firstVariantId: 'var-rec-1'
  }
];

describe('ProductDetailView Integration Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders complete editorial PDP layout with gallery, purchase controls, accordions, and pairings', () => {
    render(<ProductDetailView product={mockProduct} suggestedProducts={mockCatalog} />);

    // Heading and category
    expect(screen.getAllByText('Abayas').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Royal Emerald Abaya' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Pure artisanal drape woven from fine medina silk.').length
    ).toBeGreaterThanOrEqual(2);

    // Priority badge (computed: sale or new)
    expect(screen.getAllByText(/Sale|New/i).length).toBeGreaterThan(0);

    // Purchase Card & Sticky Bar Price
    expect(screen.getAllByText('₹2,999.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/MRP \(Inclusive of all taxes\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Add to Shopping Bag/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Buy Now/i }).length).toBeGreaterThanOrEqual(1);

    // Accordions
    expect(screen.getByText(/Description & Design Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Care & Longevity/i)).toBeInTheDocument();

    // Frequently Bought Together
    expect(screen.getByText(/Frequently Bought Together/i)).toBeInTheDocument();
    expect(screen.getAllByText('Silk Chiffon Hijab').length).toBeGreaterThanOrEqual(1);

    // Sticky purchase bar is attached
    expect(screen.getByRole('region', { name: /Sticky Buying Bar/i })).toBeInTheDocument();
  });
});
