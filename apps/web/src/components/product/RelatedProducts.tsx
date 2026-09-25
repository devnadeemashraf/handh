'use client';

import * as React from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';

import type { PublicProductListItem } from '@hh/domain';

export interface RelatedProductsProps {
  products: PublicProductListItem[];
  currentProductId: string;
  categoryName?: string | undefined;
}

export function RelatedProducts({
  products,
  currentProductId,
  categoryName
}: RelatedProductsProps) {
  // Filter out the current product and take top 4
  const related = React.useMemo(() => {
    return products.filter((p) => p.id !== currentProductId).slice(0, 4);
  }, [products, currentProductId]);

  if (related.length === 0) return null;

  return (
    <section className="my-16">
      <div className="mb-6 flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
          {categoryName ? `More from ${categoryName}` : 'Curated Recommendations'}
        </span>
        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
          You May Also Like
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
