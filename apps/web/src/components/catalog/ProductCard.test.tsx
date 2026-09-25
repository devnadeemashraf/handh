import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { DEFAULT_BRAND_IDENTITY, type PublicProductListItem } from '@hh/domain';

import { ProductCard, ProductCardSkeleton } from './ProductCard';

const mockAddItem = vi.fn();
const mockOpenCart = vi.fn();

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart
  })
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('renders Sale badge and struck-through compare price when on sale', () => {
    render(
      <ProductCard
        product={{
          ...mockProduct,
          startingPriceMinor: 149900,
          compareAtPriceMinor: 199900,
          isOnSale: true
        }}
      />
    );

    expect(screen.getByText('Sale')).toBeInTheDocument();
    expect(screen.getByText(/1,999/)).toBeInTheDocument();
  });

  it('renders New badge when isNew is true and not on sale', () => {
    render(<ProductCard product={{ ...mockProduct, isNew: true }} />);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders Low Stock badge when isLowStock is true', () => {
    render(<ProductCard product={{ ...mockProduct, isLowStock: true }} />);

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('handles quick add click directly for single-variant product', async () => {
    mockAddItem.mockResolvedValueOnce(undefined);

    render(
      <ProductCard
        product={{
          ...mockProduct,
          firstVariantId: 'var-123',
          hasMultipleVariants: false
        }}
      />
    );

    const quickAddBtns = screen.getAllByRole('button', { name: /quick add/i });
    expect(quickAddBtns.length).toBeGreaterThan(0);
    await act(async () => {
      fireEvent.click(quickAddBtns[0]!);
    });

    expect(mockAddItem).toHaveBeenCalledWith('var-123', 1);
  });

  it('renders ProductCardSkeleton with layout-preserving elements', () => {
    const { container } = render(<ProductCardSkeleton />);
    expect(container.querySelector('.aspect-\\[4\\/5\\]')).toBeInTheDocument();
  });
});
