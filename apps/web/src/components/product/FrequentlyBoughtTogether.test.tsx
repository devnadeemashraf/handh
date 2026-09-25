import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { PublicProductDetail, PublicProductListItem } from '@hh/domain';

import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';

const mockAddItem = vi.fn().mockResolvedValue(undefined);

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: vi.fn()
  })
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockProductDetail: PublicProductDetail = {
  id: 'prod-main',
  slug: 'medina-silk-abaya',
  title: 'Medina Silk Abaya',
  description: 'Handcrafted luxury abaya.',
  currency: 'INR',
  countryOfOrigin: 'India',
  netQuantity: '1 N',
  manufacturerDetails: { name: 'H&H', address: 'Bangalore' },
  category: { id: 'cat-1', slug: 'abayas', name: 'Abayas' },
  variants: [
    {
      id: 'var-main-1',
      sku: 'ABAYA-01',
      title: 'Onyx Black',
      priceMinor: 249900,
      compareAtPriceMinor: null,
      currency: 'INR',
      isAvailable: true,
      availableQuantity: 5
    }
  ],
  images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1', altText: '', sortOrder: 1 }],
  seo: { title: null, description: null }
};

const mockSuggested: PublicProductListItem[] = [
  {
    id: 'prod-sub-1',
    slug: 'chiffon-hijab',
    title: 'Chiffon Hijab',
    startingPriceMinor: 89900,
    currency: 'INR',
    primaryImageUrl: 'https://images.unsplash.com/photo-2',
    categoryName: 'Hijabs',
    isAvailable: true,
    firstVariantId: 'var-sub-1'
  }
];

describe('FrequentlyBoughtTogether Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bundle items and calculates combined total', () => {
    render(
      <FrequentlyBoughtTogether
        currentProduct={mockProductDetail}
        suggestedProducts={mockSuggested}
      />
    );

    expect(screen.getByText(/Frequently Bought Together/i)).toBeInTheDocument();
    expect(screen.getByText('This Piece')).toBeInTheDocument();
    expect(screen.getByText('Chiffon Hijab')).toBeInTheDocument();

    // Combined total: 2499 + 899 = 3398
    expect(screen.getByText('₹3,398.00')).toBeInTheDocument();
  });

  it('updates total when unchecking a complementary product', () => {
    render(
      <FrequentlyBoughtTogether
        currentProduct={mockProductDetail}
        suggestedProducts={mockSuggested}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(2);

    // Uncheck second item (Chiffon Hijab)
    fireEvent.click(checkboxes[1]!);

    // Total should now be only main piece: 2499 (matches item price and total)
    expect(screen.getAllByText('₹2,499.00').length).toBeGreaterThanOrEqual(2);
  });

  it('calls addItem for all selected items when Add Selected to Bag is clicked', async () => {
    render(
      <FrequentlyBoughtTogether
        currentProduct={mockProductDetail}
        suggestedProducts={mockSuggested}
      />
    );

    const addAllBtn = screen.getByRole('button', { name: /Add Selected to Bag/i });
    fireEvent.click(addAllBtn);

    expect(mockAddItem).toHaveBeenCalledWith('var-main-1', 1);
    expect(mockAddItem).toHaveBeenCalledWith('var-sub-1', 1);
  });
});
