'use client';

import { Check, SlidersHorizontal, X } from 'lucide-react';
import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  ModalSheet,
  ModalSheetContent,
  ModalSheetDescription,
  ModalSheetFooter,
  ModalSheetHeader,
  ModalSheetTitle
} from '@/components/ui/modal-sheet';
import { cn } from '@/lib/utils';

import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

export interface FilterState {
  categorySlug: string;
  inStockOnly: boolean;
  priceRange: string; // 'all' | 'under_2000' | '2000_5000' | 'above_5000'
  sort: 'featured' | 'newest' | 'price_asc' | 'price_desc';
}

export const DEFAULT_FILTER_STATE: FilterState = {
  categorySlug: '',
  inStockOnly: false,
  priceRange: 'all',
  sort: 'featured'
};

export const SORT_OPTIONS: { label: string; value: FilterState['sort'] }[] = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' }
];

export const PRICE_RANGE_OPTIONS = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹2,000', value: 'under_2000' },
  { label: '₹2,000 – ₹5,000', value: '2000_5000' },
  { label: 'Above ₹5,000', value: 'above_5000' }
];

/**
 * Filters a product array based on the given FilterState.
 */
export function applyProductFilters(
  products: PublicProductListItem[],
  filters: FilterState
): PublicProductListItem[] {
  return products.filter((prod) => {
    // 1. Category filter
    if (filters.categorySlug && filters.categorySlug !== 'all') {
      const catMatch =
        prod.categoryName?.toLowerCase() === filters.categorySlug.toLowerCase() ||
        prod.slug.toLowerCase().includes(filters.categorySlug.toLowerCase());
      if (!catMatch) return false;
    }

    // 2. In stock filter
    if (filters.inStockOnly && !prod.isAvailable) {
      return false;
    }

    // 3. Price range filter (startingPriceMinor in paise)
    if (filters.priceRange === 'under_2000' && prod.startingPriceMinor >= 200000) {
      return false;
    }
    if (
      filters.priceRange === '2000_5000' &&
      (prod.startingPriceMinor < 200000 || prod.startingPriceMinor > 500000)
    ) {
      return false;
    }
    if (filters.priceRange === 'above_5000' && prod.startingPriceMinor <= 500000) {
      return false;
    }

    return true;
  });
}

/**
 * Sorts products based on FilterState['sort'].
 */
export function sortProducts(
  products: PublicProductListItem[],
  sort: FilterState['sort']
): PublicProductListItem[] {
  const cloned = [...products];

  switch (sort) {
    case 'newest':
      return cloned.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    case 'price_asc':
      return cloned.sort((a, b) => a.startingPriceMinor - b.startingPriceMinor);
    case 'price_desc':
      return cloned.sort((a, b) => b.startingPriceMinor - a.startingPriceMinor);
    case 'featured':
    default:
      return cloned;
  }
}

/**
 * Desktop Sticky Left Sidebar Filter (280px)
 */
export function DesktopFilterSidebar({
  categories,
  filters,
  onFilterChange,
  allProducts,
  className
}: {
  categories: CategoryTreeItem[];
  filters: FilterState;
  onFilterChange: (next: FilterState) => void;
  allProducts: PublicProductListItem[];
  className?: string;
}) {
  const hasActiveFilters =
    filters.categorySlug !== '' || filters.inStockOnly || filters.priceRange !== 'all';

  return (
    <aside
      className={cn(
        'hidden md:block w-[260px] lg:w-[280px] shrink-0 sticky top-24 self-start space-y-6',
        className
      )}
      aria-label="Product filters"
    >
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h2 className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() =>
              onFilterChange({
                ...filters,
                categorySlug: '',
                inStockOnly: false,
                priceRange: 'all'
              })
            }
            className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['category', 'price', 'availability']}
        className="w-full"
      >
        {/* Category Accordion */}
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="text-sm font-sans font-medium uppercase tracking-wider text-foreground py-3">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onFilterChange({ ...filters, categorySlug: '' })}
                  className={cn(
                    'flex w-full items-center justify-between py-1.5 px-2 rounded-sm text-xs transition-colors text-left',
                    filters.categorySlug === ''
                      ? 'bg-accent text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <span>All Categories</span>
                  <span className="text-[11px] text-muted-foreground">{allProducts.length}</span>
                </button>

                {categories.map((cat) => {
                  const isSelected = filters.categorySlug === cat.slug;
                  const count = allProducts.filter(
                    (p) =>
                      p.categoryName?.toLowerCase() === cat.name.toLowerCase() ||
                      p.slug.toLowerCase().includes(cat.slug.toLowerCase())
                  ).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onFilterChange({ ...filters, categorySlug: cat.slug })}
                      className={cn(
                        'flex w-full items-center justify-between py-1.5 px-2 rounded-sm text-xs transition-colors text-left',
                        isSelected
                          ? 'bg-accent text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[11px] text-muted-foreground">{count}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Availability Accordion */}
        <AccordionItem value="availability">
          <AccordionTrigger className="text-sm font-sans font-medium uppercase tracking-wider text-foreground py-3">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-sm hover:bg-muted/40 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
                  className="h-4 w-4 rounded-sm border-input text-primary focus:ring-ring"
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Accordion */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-sans font-medium uppercase tracking-wider text-foreground py-3">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1 pt-1">
              {PRICE_RANGE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 cursor-pointer py-1.5 px-2 rounded-sm hover:bg-muted/40 text-xs text-foreground"
                >
                  <input
                    type="radio"
                    name="desktopPriceRange"
                    value={opt.value}
                    checked={filters.priceRange === opt.value}
                    onChange={() => onFilterChange({ ...filters, priceRange: opt.value })}
                    className="h-4 w-4 border-input text-primary focus:ring-ring"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

/**
 * Mobile Filter Bottom Sheet with Live Item Counter
 */
export function MobileFilterBottomSheet({
  isOpen,
  onClose,
  categories,
  currentFilters,
  onApplyFilters,
  allProducts
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryTreeItem[];
  currentFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  allProducts: PublicProductListItem[];
}) {
  // Local scratch state for live counter before committing
  const [draftFilters, setDraftFilters] = React.useState<FilterState>(currentFilters);

  React.useEffect(() => {
    if (isOpen) {
      setDraftFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  // Compute live match count dynamically
  const liveCount = React.useMemo(() => {
    return applyProductFilters(allProducts, draftFilters).length;
  }, [allProducts, draftFilters]);

  const handleApply = () => {
    onApplyFilters(draftFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FilterState = {
      ...draftFilters,
      categorySlug: '',
      inStockOnly: false,
      priceRange: 'all'
    };
    setDraftFilters(cleared);
  };

  return (
    <ModalSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalSheetContent className="max-h-[90vh] flex flex-col p-5">
        <ModalSheetHeader className="border-b border-border pb-3">
          <ModalSheetTitle className="font-serif text-lg">Filter Catalog</ModalSheetTitle>
          <ModalSheetDescription className="text-xs text-muted-foreground">
            Refine selection by category, availability, and price.
          </ModalSheetDescription>
        </ModalSheetHeader>

        {/* Scrollable Facets */}
        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">
                Category
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDraftFilters((d) => ({ ...d, categorySlug: '' }))}
                  className={cn(
                    'flex items-center justify-between rounded-sm border p-2.5 text-xs text-left min-h-[44px]',
                    draftFilters.categorySlug === ''
                      ? 'border-primary bg-accent text-primary font-medium'
                      : 'border-border bg-card text-foreground'
                  )}
                >
                  <span className="truncate">All Categories</span>
                  {draftFilters.categorySlug === '' && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
                {categories.map((cat) => {
                  const isSelected = draftFilters.categorySlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDraftFilters((d) => ({ ...d, categorySlug: cat.slug }))}
                      className={cn(
                        'flex items-center justify-between rounded-sm border p-2.5 text-xs text-left min-h-[44px]',
                        isSelected
                          ? 'border-primary bg-accent text-primary font-medium'
                          : 'border-border bg-card text-foreground'
                      )}
                    >
                      <span className="truncate">{cat.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">
              Availability
            </h3>
            <label className="flex items-center justify-between rounded-sm border border-border p-3 min-h-[44px] cursor-pointer bg-card">
              <span className="text-xs font-medium text-foreground">In Stock Only</span>
              <input
                type="checkbox"
                checked={draftFilters.inStockOnly}
                onChange={(e) => setDraftFilters((d) => ({ ...d, inStockOnly: e.target.checked }))}
                className="h-4 w-4 rounded-sm border-input text-primary focus:ring-ring"
              />
            </label>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2.5">
              Price Range
            </h3>
            <div className="space-y-2">
              {PRICE_RANGE_OPTIONS.map((opt) => {
                const isSelected = draftFilters.priceRange === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-center justify-between rounded-sm border p-3 min-h-[44px] cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary bg-accent text-primary font-medium'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    <span className="text-xs">{opt.label}</span>
                    <input
                      type="radio"
                      name="mobilePriceRange"
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => setDraftFilters((d) => ({ ...d, priceRange: opt.value }))}
                      className="sr-only"
                    />
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fixed Action Footer per 03 & 05 Design Spec: Clear All + Live Counter Primary CTA */}
        <ModalSheetFooter className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClear}
            className="w-full text-xs uppercase tracking-wider h-11"
          >
            Clear all
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
            className="w-full text-xs uppercase tracking-wider h-11"
          >
            Show {liveCount} items
          </Button>
        </ModalSheetFooter>
      </ModalSheetContent>
    </ModalSheet>
  );
}

/**
 * Mobile Sort Bottom Sheet
 */
export function MobileSortBottomSheet({
  isOpen,
  onClose,
  currentSort,
  onSelectSort
}: {
  isOpen: boolean;
  onClose: () => void;
  currentSort: FilterState['sort'];
  onSelectSort: (sort: FilterState['sort']) => void;
}) {
  return (
    <ModalSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalSheetContent className="p-5 max-w-sm">
        <ModalSheetHeader className="border-b border-border pb-3">
          <ModalSheetTitle className="font-serif text-lg">Sort Collection</ModalSheetTitle>
          <ModalSheetDescription className="sr-only">
            Select ordering for catalog items
          </ModalSheetDescription>
        </ModalSheetHeader>

        <div className="space-y-2 py-4">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = currentSort === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelectSort(opt.value);
                  onClose();
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-sm border p-3 text-xs font-medium min-h-[44px] transition-colors text-left',
                  isSelected
                    ? 'border-primary bg-accent text-primary'
                    : 'border-border bg-card text-foreground hover:border-input'
                )}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </ModalSheetContent>
    </ModalSheet>
  );
}

/**
 * Active Filter Chips Component with Inline × Remove Action
 */
export function ActiveFilterChips({
  filters,
  categories,
  onRemoveCategory,
  onRemoveStock,
  onRemovePrice,
  onClearAll,
  className
}: {
  filters: FilterState;
  categories: CategoryTreeItem[];
  onRemoveCategory: () => void;
  onRemoveStock: () => void;
  onRemovePrice: () => void;
  onClearAll: () => void;
  className?: string;
}) {
  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];

  if (filters.categorySlug && filters.categorySlug !== 'all') {
    const found = categories.find((c) => c.slug === filters.categorySlug);
    activeChips.push({
      id: 'category',
      label: found ? found.name : filters.categorySlug,
      onRemove: onRemoveCategory
    });
  }

  if (filters.inStockOnly) {
    activeChips.push({
      id: 'stock',
      label: 'In Stock Only',
      onRemove: onRemoveStock
    });
  }

  if (filters.priceRange !== 'all') {
    const found = PRICE_RANGE_OPTIONS.find((p) => p.value === filters.priceRange);
    if (found) {
      activeChips.push({
        id: 'price',
        label: found.label,
        onRemove: onRemovePrice
      });
    }
  }

  if (activeChips.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 py-3 border-b border-border', className)}
      aria-label="Active filters"
    >
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mr-1">
        Active:
      </span>

      {activeChips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-accent px-2.5 py-1 text-xs font-medium text-primary transition-colors"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="rounded-xs hover:bg-primary/10 p-0.5 focus:outline-none"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {activeChips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors underline ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
