import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DEFAULT_BRAND_IDENTITY, type PublicProductListItem } from '@hh/domain';

import { ProductCard } from './ProductCard';

const mockProduct: PublicProductListItem = {
  id: 'prod-123',
  title: 'Regal Emerald Nose Stud',
  slug: 'regal-emerald-nose-stud',
  categoryName: 'Nose Studs',
  startingPriceMinor: 149900,
  currency: 'INR',
  primaryImageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
  isAvailable: true
};

describe('ProductCard Component', () => {
  it('renders product details, category, and tax-inclusive MRP price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Regal Emerald Nose Stud')).toBeInTheDocument();
    expect(screen.getByText('Nose Studs')).toBeInTheDocument();
    expect(screen.getByText(/1,499/)).toBeInTheDocument();
    expect(screen.getByText('MRP (incl. taxes)')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders Sold Out badge when product is unavailable', () => {
    render(<ProductCard product={{ ...mockProduct, isAvailable: false }} />);

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  it('renders brand signature placeholder when primaryImageUrl is missing', () => {
    render(<ProductCard product={{ ...mockProduct, primaryImageUrl: null }} />);

    expect(screen.getByText(`${DEFAULT_BRAND_IDENTITY.shortName} Signature`)).toBeInTheDocument();
  });

  it('renders image with priority attribute when priority prop is true', () => {
    const { unmount } = render(<ProductCard product={mockProduct} priority={false} />);
    const lazyImg = screen.getByRole('img', { name: 'Regal Emerald Nose Stud' });
    expect(lazyImg).toHaveAttribute('loading', 'lazy');
    unmount();

    render(<ProductCard product={mockProduct} priority={true} />);
    const priorityImg = screen.getByRole('img', { name: 'Regal Emerald Nose Stud' });
    expect(priorityImg).not.toHaveAttribute('loading', 'lazy');
  });
});
