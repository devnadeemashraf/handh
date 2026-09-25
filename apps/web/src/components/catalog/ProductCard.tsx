'use client';

import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import {
  type CurrencyCode,
  DEFAULT_BRAND_IDENTITY,
  Money,
  type PublicProductListItem
} from '@hh/domain';

import { WishlistButton } from '../product/WishlistButton';
import { QuickAddModal } from './QuickAddModal';

export interface ProductCardProps {
  product: PublicProductListItem;
  priority?: boolean;
  className?: string;
  onQuickAdd?: (product: PublicProductListItem) => void;
}

export function ProductCard({
  product,
  priority = false,
  className,
  onQuickAdd
}: ProductCardProps) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = React.useState(false);
  const [isDirectAdding, setIsDirectAdding] = React.useState(false);

  const currency = (product.currency as CurrencyCode) || 'INR';
  const formattedPrice = Money.fromMinor(product.startingPriceMinor, currency).format('en-IN');

  const comparePrice =
    product.compareAtPriceMinor && product.compareAtPriceMinor > product.startingPriceMinor
      ? Money.fromMinor(product.compareAtPriceMinor, currency).format('en-IN')
      : null;

  // Single badge priority order: Sold Out > Sale > New > Low Stock > In Stock
  const badgeConfig = React.useMemo(() => {
    if (!product.isAvailable) {
      return {
        label: 'Sold Out',
        variant: 'secondary' as const,
        className: 'bg-muted text-muted-foreground border-transparent'
      };
    }
    if (product.isOnSale || comparePrice !== null) {
      return {
        label: 'Sale',
        variant: 'destructive' as const,
        className: 'bg-sale/10 text-destructive border-transparent'
      };
    }
    if (product.isNew) {
      return {
        label: 'New',
        variant: 'default' as const,
        className: 'bg-accent text-primary border-transparent'
      };
    }
    if (product.isLowStock) {
      return {
        label: 'Low Stock',
        variant: 'outline' as const,
        className: 'bg-warning/10 text-warning border-transparent'
      };
    }
    return {
      label: 'In Stock',
      variant: 'default' as const,
      className: 'bg-card/90 text-primary border-border shadow-xs'
    };
  }, [product.isAvailable, product.isOnSale, product.isNew, product.isLowStock, comparePrice]);

  const handleQuickAddClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.isAvailable) return;

    if (onQuickAdd) {
      onQuickAdd(product);
      return;
    }

    // If multiple variants or customizable, open the selection bottom-sheet/modal
    if (product.hasMultipleVariants || product.isCustomizable || !product.firstVariantId) {
      setIsQuickAddModalOpen(true);
      return;
    }

    // Direct 1-click addition if only 1 variant exists
    try {
      setIsDirectAdding(true);
      await addItem(product.firstVariantId, 1);
      toast({
        message: `Added ${product.title} to your bag`,
        variant: 'success',
        action: {
          label: 'View Bag',
          onClick: openCart
        }
      });
    } catch {
      toast({
        message: 'Could not add item to bag. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsDirectAdding(false);
    }
  };

  return (
    <>
      <article
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-md bg-card border border-border transition-all duration-base hover:border-input',
          className
        )}
      >
        {/* Wishlist Button floating top-right (min 44x44px hit target) */}
        <div className="absolute top-2 right-2 z-20 sm:top-2.5 sm:right-2.5">
          <WishlistButton productId={product.id} size={18} />
        </div>

        {/* 4:5 Fixed Aspect Ratio Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted rounded-t-md">
          <Link
            href={`/products/${product.slug}`}
            className="block h-full w-full relative focus:outline-none"
          >
            {product.primaryImageUrl ? (
              <>
                {/* Primary Image */}
                <Image
                  src={product.primaryImageUrl}
                  alt={product.title}
                  fill
                  priority={priority}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={cn(
                    'object-cover transition-opacity duration-base',
                    product.secondaryImageUrl
                      ? 'group-hover:opacity-0 md:group-hover:opacity-0'
                      : 'group-hover:scale-[1.02] transition-transform duration-slow'
                  )}
                />

                {/* Secondary Image cross-fade on desktop hover */}
                {product.secondaryImageUrl && (
                  <Image
                    src={product.secondaryImageUrl}
                    alt={`${product.title} - alternate view`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover opacity-0 transition-opacity duration-base hidden md:block group-hover:opacity-100"
                  />
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center font-serif text-xs tracking-widest uppercase text-muted-foreground">
                {DEFAULT_BRAND_IDENTITY.shortName} Signature
              </div>
            )}
          </Link>

          {/* Priority Badge Overlay (Top Left) */}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
            <Badge
              variant={badgeConfig.variant}
              className={cn(
                'text-[9px] sm:text-[10px] uppercase font-medium tracking-[0.06em] px-2 py-0.5 rounded-sm select-none',
                badgeConfig.className
              )}
            >
              {badgeConfig.label}
            </Badge>
          </div>

          {/* Mobile Persistent Quick-Add Affordance (Bottom Right, 44x44px touch target) */}
          {product.isAvailable && (
            <div className="absolute bottom-2 right-2 z-10 md:hidden">
              <button
                type="button"
                onClick={handleQuickAddClick}
                disabled={isDirectAdding}
                aria-label={`Quick add ${product.title} to bag`}
                className="flex h-11 w-11 items-center justify-center rounded-sm bg-card/95 text-foreground shadow-sm border border-border active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Desktop Slide-up Quick Add Action Button (Reveals on hover) */}
          {product.isAvailable && (
            <div className="absolute inset-x-2.5 bottom-2.5 hidden z-10 md:block transition-all duration-base translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleQuickAddClick}
                disabled={isDirectAdding}
                className="w-full h-9 bg-card/95 backdrop-blur-sm text-foreground hover:bg-card border-input text-[11px] uppercase tracking-wider font-medium shadow-sm transition-colors"
              >
                {isDirectAdding ? 'Adding...' : 'Quick Add'}
              </Button>
            </div>
          )}
        </div>

        {/* Card Content Block */}
        <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
          <div>
            {product.categoryName && (
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] font-medium text-muted-foreground truncate">
                {product.categoryName}
              </span>
            )}

            {/* Single-line title with ellipsis truncation */}
            <h3 className="font-sans text-xs sm:text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
              <Link
                href={`/products/${product.slug}`}
                className="focus:outline-none focus:underline"
              >
                {product.title}
              </Link>
            </h3>

            {/* Color variant count if > 1 */}
            {product.colorCount && product.colorCount > 1 ? (
              <p className="mt-1 text-[11px] text-muted-foreground">{product.colorCount} colors</p>
            ) : null}
          </div>

          {/* Tabular Price Row */}
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-2.5">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'font-mono text-xs sm:text-sm font-medium tabular-nums',
                  comparePrice ? 'text-destructive' : 'text-foreground'
                )}
              >
                {formattedPrice}
              </span>
              {comparePrice && (
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground line-through">
                  {comparePrice}
                </span>
              )}
            </div>

            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              MRP (incl. taxes)
            </span>
          </div>
        </div>
      </article>

      {/* Quick Add Modal */}
      <QuickAddModal
        product={product}
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
      />
    </>
  );
}

/**
 * Layout-preserving skeleton matching exact 4:5 component geometry.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      {/* 4:5 image skeleton */}
      <Skeleton className="aspect-[4/5] w-full rounded-t-md rounded-b-none bg-muted" />

      {/* Content skeleton */}
      <div className="space-y-2 p-3 sm:p-4">
        <Skeleton className="h-2.5 w-1/3 bg-muted" />
        <Skeleton className="h-4 w-4/5 bg-muted" />
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
          <Skeleton className="h-3.5 w-16 bg-muted" />
          <Skeleton className="h-2.5 w-12 bg-muted" />
        </div>
      </div>
    </div>
  );
}
