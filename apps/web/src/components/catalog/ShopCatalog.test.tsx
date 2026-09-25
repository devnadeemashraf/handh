import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

import { ShopCatalog } from './ShopCatalog';

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/shop'
}));

vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: vi.fn(),
    openCart: vi.fn()
  })
}));

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockProducts: PublicProductListItem[] = [
  {
    id: 'p1',
    slug: 'pure-raw-silk-abaya',
    title: 'Pure Raw Silk Abaya',
    categoryName: 'Abayas',
    startingPriceMinor: 899900,
    currency: 'INR',
    primaryImageUrl: null,
    isAvailable: true
  },
  {
    id: 'p2',
    slug: 'silver-nose-ring',
    title: 'Silver Nose Ring',
    categoryName: 'Accessories',
    startingPriceMinor: 149900,
    currency: 'INR',
    primaryImageUrl: null,
    isAvailable: true
  }
];

const mockCategories: CategoryTreeItem[] = [
  { id: 'c1', slug: 'abayas', name: 'Abayas', description: null, subcategories: [] },
  { id: 'c2', slug: 'accessories', name: 'Accessories', description: null, subcategories: [] }
];

describe('ShopCatalog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders catalog header with title and item count', () => {
    render(
      <ShopCatalog
        products={mockProducts}
        categories={mockCategories}
        title="Artisanal Collection"
      />
    );

    expect(screen.getByText('Artisanal Collection')).toBeInTheDocument();
    expect(screen.getByText('(2 items)')).toBeInTheDocument();
    expect(screen.getByText('Pure Raw Silk Abaya')).toBeInTheDocument();
    expect(screen.getByText('Silver Nose Ring')).toBeInTheDocument();
  });

  it('displays empty state when products list is empty', () => {
    render(<ShopCatalog products={[]} categories={mockCategories} title="Empty Drop" />);

    expect(screen.getByText('No matching pieces found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
  });

  it('opens mobile filter bottom sheet when filter button is clicked', () => {
    render(<ShopCatalog products={mockProducts} categories={mockCategories} />);

    const filterBtn = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterBtn);

    expect(screen.getByText('Filter Catalog')).toBeInTheDocument();
  });
});
