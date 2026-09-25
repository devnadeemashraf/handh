'use client';

import { Sparkles } from 'lucide-react';
import * as React from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { cn } from '@/lib/utils';

import type { PublicProductListItem } from '@hh/domain';

export interface CartComplementaryProps {
  products?: PublicProductListItem[];
  className?: string;
}

export function CartComplementary({
  products: initialProducts,
  className
}: CartComplementaryProps) {
  const [products, setProducts] = React.useState<PublicProductListItem[]>(initialProducts || []);
  const [isLoading, setIsLoading] = React.useState(!initialProducts);

  React.useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    fetch('/api/products?limit=4')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products.slice(0, 4));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialProducts]);

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      aria-labelledby="complementary-heading"
      className={cn('mt-8 pt-6 border-t border-border', className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h2 id="complementary-heading" className="font-serif text-lg font-semibold text-foreground">
          Pairs Well With Your Bag
        </h2>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[200px] sm:w-[220px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
