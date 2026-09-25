'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/analytics';

interface ProductViewTrackerProps {
  productId: string;
  productName: string;
  priceMinor: number;
  categoryName?: string | undefined;
}

/**
 * Pure stateless client leaf — fires a product_viewed analytics event once on mount.
 * Kept as a separate component so the parent PDP page can remain a React Server Component.
 */
export function ProductViewTracker({
  productId,
  productName,
  priceMinor,
  categoryName
}: ProductViewTrackerProps) {
  useEffect(() => {
    trackProductView({ productId, productName, priceMinor, categoryName });
  }, [productId, productName, priceMinor, categoryName]);

  return null;
}
