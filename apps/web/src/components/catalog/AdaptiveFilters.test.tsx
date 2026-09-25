import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

import {
  ActiveFilterChips,
  applyProductFilters,
  DEFAULT_FILTER_STATE,
  DesktopFilterSidebar,
  MobileFilterBottomSheet,
  sortProducts
} from './AdaptiveFilters';

const mockProducts: PublicProductListItem[] = [
  {
    id: 'p1',
    slug: 'silk-abaya',
    title: 'Silk Abaya',
    categoryName: 'Abayas',
    startingPriceMinor: 450000, // ₹4,500
    currency: 'INR',
    primaryImageUrl: null,
    isAvailable: true,
    isNew: true
  },
  {
    id: 'p2',
    slug: 'emerald-nose-pin',
    title: 'Emerald Nose Pin',
    categoryName: 'Accessories',
    startingPriceMinor: 150000, // ₹1,500
    currency: 'INR',
    primaryImageUrl: null,
    isAvailable: true,
    isNew: false
  },
  {
    id: 'p3',
    slug: 'gold-ring',
    title: 'Gold Ring',
    categoryName: 'Jewelry',
    startingPriceMinor: 600000, // ₹6,000
    currency: 'INR',
    primaryImageUrl: null,
    isAvailable: false,
    isNew: false
  }
];

const mockCategories: CategoryTreeItem[] = [
  { id: 'c1', slug: 'abayas', name: 'Abayas', description: null, subcategories: [] },
  { id: 'c2', slug: 'accessories', name: 'Accessories', description: null, subcategories: [] },
  { id: 'c3', slug: 'jewelry', name: 'Jewelry', description: null, subcategories: [] }
];

describe('AdaptiveFilters System', () => {
  describe('applyProductFilters', () => {
    it('filters by categorySlug', () => {
      const filtered = applyProductFilters(mockProducts, {
        ...DEFAULT_FILTER_STATE,
        categorySlug: 'abayas'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Silk Abaya');
    });

    it('filters by inStockOnly', () => {
      const filtered = applyProductFilters(mockProducts, {
        ...DEFAULT_FILTER_STATE,
        inStockOnly: true
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.some((p) => p.title === 'Gold Ring')).toBe(false);
    });

    it('filters by priceRange under_2000', () => {
      const filtered = applyProductFilters(mockProducts, {
        ...DEFAULT_FILTER_STATE,
        priceRange: 'under_2000'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Emerald Nose Pin');
    });

    it('filters by priceRange 2000_5000', () => {
      const filtered = applyProductFilters(mockProducts, {
        ...DEFAULT_FILTER_STATE,
        priceRange: '2000_5000'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Silk Abaya');
    });

    it('filters by priceRange above_5000', () => {
      const filtered = applyProductFilters(mockProducts, {
        ...DEFAULT_FILTER_STATE,
        priceRange: 'above_5000'
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Gold Ring');
    });
  });

  describe('sortProducts', () => {
    it('sorts by price_asc', () => {
      const sorted = sortProducts(mockProducts, 'price_asc');
      expect(sorted[0]?.startingPriceMinor).toBe(150000);
      expect(sorted[2]?.startingPriceMinor).toBe(600000);
    });

    it('sorts by price_desc', () => {
      const sorted = sortProducts(mockProducts, 'price_desc');
      expect(sorted[0]?.startingPriceMinor).toBe(600000);
      expect(sorted[2]?.startingPriceMinor).toBe(150000);
    });

    it('sorts by newest', () => {
      const sorted = sortProducts(mockProducts, 'newest');
      expect(sorted[0]?.isNew).toBe(true);
    });
  });

  describe('DesktopFilterSidebar', () => {
    it('renders category options and triggers filter change', () => {
      const onFilterChange = vi.fn();
      render(
        <DesktopFilterSidebar
          categories={mockCategories}
          filters={DEFAULT_FILTER_STATE}
          onFilterChange={onFilterChange}
          allProducts={mockProducts}
        />
      );

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Abayas')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Abayas'));
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ categorySlug: 'abayas' })
      );
    });
  });

  describe('MobileFilterBottomSheet', () => {
    it('computes live matching count and applies filters', () => {
      const onApplyFilters = vi.fn();
      const onClose = vi.fn();

      render(
        <MobileFilterBottomSheet
          isOpen={true}
          onClose={onClose}
          categories={mockCategories}
          currentFilters={DEFAULT_FILTER_STATE}
          onApplyFilters={onApplyFilters}
          allProducts={mockProducts}
        />
      );

      // Initially 3 items match
      expect(screen.getByRole('button', { name: /show 3 items/i })).toBeInTheDocument();

      // Tap In Stock Only checkbox
      const inStockCheckbox = screen.getByRole('checkbox');
      fireEvent.click(inStockCheckbox);

      // Live count becomes 2
      expect(screen.getByRole('button', { name: /show 2 items/i })).toBeInTheDocument();

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /show 2 items/i }));
      expect(onApplyFilters).toHaveBeenCalledWith(expect.objectContaining({ inStockOnly: true }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ActiveFilterChips', () => {
    it('renders active filter chips and allows removal', () => {
      const onRemoveCategory = vi.fn();
      const onRemoveStock = vi.fn();
      const onRemovePrice = vi.fn();
      const onClearAll = vi.fn();

      render(
        <ActiveFilterChips
          filters={{
            categorySlug: 'abayas',
            inStockOnly: true,
            priceRange: 'under_2000',
            sort: 'featured'
          }}
          categories={mockCategories}
          onRemoveCategory={onRemoveCategory}
          onRemoveStock={onRemoveStock}
          onRemovePrice={onRemovePrice}
          onClearAll={onClearAll}
        />
      );

      expect(screen.getByText('Abayas')).toBeInTheDocument();
      expect(screen.getByText('In Stock Only')).toBeInTheDocument();
      expect(screen.getByText('Under ₹2,000')).toBeInTheDocument();

      const removeCategoryBtn = screen.getByRole('button', { name: /remove filter abayas/i });
      fireEvent.click(removeCategoryBtn);
      expect(onRemoveCategory).toHaveBeenCalled();

      const clearAllBtn = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearAllBtn);
      expect(onClearAll).toHaveBeenCalled();
    });
  });
});
