import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { PublicProductListItem } from '@hh/domain';

import { RecentlyViewed } from './RecentlyViewed';

// Mock ProductCard
vi.mock('@/components/catalog/ProductCard', () => ({
  ProductCard: ({ product }: { product: PublicProductListItem }) => (
    <div data-testid={`product-card-${product.id}`}>{product.title}</div>
  )
}));

const mockProduct: PublicProductListItem = {
  id: 'prod-viewed-1',
  slug: 'silk-scarf',
  title: 'Silk Scarf',
  startingPriceMinor: 99900,
  currency: 'INR',
  primaryImageUrl: null,
  categoryName: 'Scarves',
  isAvailable: true
};

describe('RecentlyViewed Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders nothing when history is empty and no prior views', () => {
    const { container } = render(<RecentlyViewed />);
    expect(container.firstChild).toBeNull();
  });

  it('saves current product to localStorage on mount and displays prior products', () => {
    // Seed prior product in localStorage
    localStorage.setItem(
      'hh_recently_viewed_v1',
      JSON.stringify([
        {
          id: 'prod-viewed-prior',
          slug: 'prior-scarf',
          title: 'Prior Scarf',
          startingPriceMinor: 129900,
          currency: 'INR',
          primaryImageUrl: null,
          categoryName: 'Scarves',
          isAvailable: true
        }
      ])
    );

    render(<RecentlyViewed currentProduct={mockProduct} />);

    expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-prod-viewed-prior')).toBeInTheDocument();

    // Verify localStorage has both
    const stored = JSON.parse(localStorage.getItem('hh_recently_viewed_v1') || '[]');
    expect(stored.length).toBe(2);
    expect(stored[0].id).toBe('prod-viewed-1');
  });
});
