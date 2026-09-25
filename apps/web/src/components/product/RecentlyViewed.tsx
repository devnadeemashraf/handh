'use client';

import * as React from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';

import type { PublicProductListItem } from '@hh/domain';

const STORAGE_KEY = 'hh_recently_viewed_v1';
const MAX_HISTORY = 8;

export interface RecentlyViewedProps {
  currentProduct?: PublicProductListItem | undefined;
}

export function RecentlyViewed({ currentProduct }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = React.useState<PublicProductListItem[]>([]);

  // Update history on mount with current product
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: PublicProductListItem[] = stored ? JSON.parse(stored) : [];

      if (currentProduct) {
        // Remove current if exists, prepend to front
        items = [currentProduct, ...items.filter((p) => p.id !== currentProduct.id)].slice(
          0,
          MAX_HISTORY
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }

      // Filter out current product for the display list
      const displayItems = items.filter((p) => !currentProduct || p.id !== currentProduct.id);
      setRecentProducts(displayItems.slice(0, 4));
    } catch {
      // LocalStorage access failure is non-fatal
    }
  }, [currentProduct]);

  // Gracefully omit if no prior browsing history exists
  if (recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="my-16 border-t border-border pt-12">
      <div className="mb-6 flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
          Browsing History
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
          Recently Viewed
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {recentProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
