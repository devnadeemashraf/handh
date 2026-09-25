'use client';

import { ArrowUpDown, ChevronDown, PackageX, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

import {
  ActiveFilterChips,
  applyProductFilters,
  DesktopFilterSidebar,
  type FilterState,
  MobileFilterBottomSheet,
  MobileSortBottomSheet,
  SORT_OPTIONS,
  sortProducts
} from './AdaptiveFilters';
import { ProductCard } from './ProductCard';

export interface ShopCatalogProps {
  products: PublicProductListItem[];
  categories: CategoryTreeItem[];
  initialCategory?: string;
  title?: string;
  description?: string;
}

const ITEMS_PER_PAGE = 12;

export function ShopCatalog({
  products,
  categories,
  initialCategory = '',
  title = 'All Pieces',
  description
}: ShopCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL or defaults
  const [filters, setFilters] = React.useState<FilterState>(() => {
    const cat = searchParams.get('category') || initialCategory;
    const inStock = searchParams.get('inStock') === 'true';
    const price = searchParams.get('price') || 'all';
    const sort = (searchParams.get('sort') as FilterState['sort']) || 'featured';

    return {
      categorySlug: cat,
      inStockOnly: inStock,
      priceRange: price,
      sort
    };
  });

  const [isFilterSheetOpen, setIsFilterSheetOpen] = React.useState(false);
  const [isSortSheetOpen, setIsSortSheetOpen] = React.useState(false);
  const [visibleCount, setVisibleCount] = React.useState(ITEMS_PER_PAGE);

  // Sync state to URL search parameters
  const updateFilters = React.useCallback(
    (next: FilterState) => {
      setFilters(next);
      setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on filter change

      const params = new URLSearchParams();
      if (next.categorySlug) params.set('category', next.categorySlug);
      if (next.inStockOnly) params.set('inStock', 'true');
      if (next.priceRange !== 'all') params.set('price', next.priceRange);
      if (next.sort !== 'featured') params.set('sort', next.sort);

      const qs = params.toString();
      const newUrl = qs ? `?${qs}` : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Filter and sort items
  const filteredProducts = React.useMemo(() => {
    const matched = applyProductFilters(products, filters);
    return sortProducts(matched, filters.sort);
  }, [products, filters]);

  const pagedProducts = React.useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const hasMore = visibleCount < filteredProducts.length;

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === filters.sort)?.label || 'Featured';

  return (
    <div className="w-full">
      {/* Sticky Sub-Header: Item count left, Filter & Sort buttons right */}
      <div className="sticky top-16 z-30 flex items-center justify-between border-b border-border bg-background/95 py-3.5 backdrop-blur-md">
        <div className="flex items-baseline gap-2">
          <h1 className="font-serif text-lg sm:text-xl font-medium text-foreground">{title}</h1>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            ({filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'})
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex md:hidden items-center gap-1.5 h-9 rounded-sm border-input text-xs uppercase tracking-wider"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filter</span>
            {(filters.categorySlug || filters.inStockOnly || filters.priceRange !== 'all') && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Button>

          {/* Mobile Sort Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSortSheetOpen(true)}
            className="flex md:hidden items-center gap-1.5 h-9 rounded-sm text-xs uppercase tracking-wider text-muted-foreground"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort</span>
          </Button>

          {/* Desktop Sort Dropdown Menu */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Sort by:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-sm border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-input focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => updateFilters({ ...filters, sort: opt.value })}
                    className={cn(
                      'text-xs cursor-pointer',
                      filters.sort === opt.value
                        ? 'font-medium text-primary bg-accent'
                        : 'text-foreground'
                    )}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      <ActiveFilterChips
        filters={filters}
        categories={categories}
        onRemoveCategory={() => updateFilters({ ...filters, categorySlug: '' })}
        onRemoveStock={() => updateFilters({ ...filters, inStockOnly: false })}
        onRemovePrice={() => updateFilters({ ...filters, priceRange: 'all' })}
        onClearAll={() =>
          updateFilters({ ...filters, categorySlug: '', inStockOnly: false, priceRange: 'all' })
        }
      />

      {/* Main Catalog Section: Left Sticky Sidebar (Desktop) + Product Grid */}
      <div className="flex gap-8 lg:gap-10 pt-6">
        {/* Desktop Sticky Left Sidebar */}
        <DesktopFilterSidebar
          categories={categories}
          filters={filters}
          onFilterChange={updateFilters}
          allProducts={products}
        />

        {/* Products Grid Column */}
        <div className="flex-1">
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}

          {filteredProducts.length > 0 ? (
            <>
              {/* 2-column mobile, 3-4 column desktop grid per 03 & 05 Design Spec */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {pagedProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-12 flex justify-center pb-8">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    className="min-w-[180px] text-xs uppercase tracking-wider h-11"
                  >
                    Load More ({filteredProducts.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Calm Empty State (Design Spec 11) */
            <div className="flex flex-col items-center justify-center rounded-md border border-border bg-card p-12 text-center my-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                <PackageX className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base sm:text-lg font-medium text-foreground">
                No matching pieces found
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                We could not find any items matching your current filters. Try resetting the filters
                to explore the full collection.
              </p>
              <div className="mt-5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    updateFilters({
                      ...filters,
                      categorySlug: '',
                      inStockOnly: false,
                      priceRange: 'all'
                    })
                  }
                  className="text-xs uppercase tracking-wider"
                >
                  Clear all filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet with live count */}
      <MobileFilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        categories={categories}
        currentFilters={filters}
        onApplyFilters={updateFilters}
        allProducts={products}
      />

      {/* Mobile Sort Bottom Sheet */}
      <MobileSortBottomSheet
        isOpen={isSortSheetOpen}
        onClose={() => setIsSortSheetOpen(false)}
        currentSort={filters.sort}
        onSelectSort={(sort) => updateFilters({ ...filters, sort })}
      />
    </div>
  );
}
