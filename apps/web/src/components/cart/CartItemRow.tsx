'use client';

import { AlertCircle, Bookmark, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Money } from '@hh/domain';

import type { CartItemDetail } from '@hh/domain';

export interface CartItemRowProps {
  item: CartItemDetail;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater?: () => void;
  disabled?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  onSaveForLater,
  disabled = false
}: CartItemRowProps) {
  const formattedUnitPrice = Money.fromMinor(item.priceMinor, 'INR').format();
  const formattedLineTotal = Money.fromMinor(item.lineTotalMinor, 'INR').format();

  const isOutOfStock = item.statusNotice === 'out_of_stock';
  const isQuantityReduced = item.statusNotice === 'quantity_reduced';
  const isUnavailable = item.statusNotice === 'unavailable';

  return (
    <div className="flex gap-4 py-4 border-b border-border items-start">
      {/* Thumbnail: 4:5 cropped aspect ratio (~88px height), rounded-md: 4px */}
      <div className="relative w-[70px] h-[88px] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {item.primaryImageUrl ? (
          <Image
            src={item.primaryImageUrl}
            alt={item.productTitle}
            fill
            sizes="70px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center font-serif text-[11px] font-medium text-primary">
            H&amp;H
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            {item.productSlug ? (
              <Link
                href={`/products/${item.productSlug}`}
                className="block text-sm font-medium text-foreground hover:text-primary transition-colors leading-snug line-clamp-1"
              >
                {item.productTitle}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground line-clamp-1">
                {item.productTitle}
              </span>
            )}
            {item.variantTitle &&
              item.variantTitle !== 'Default' &&
              item.variantTitle !== 'Default Variant' && (
                <div className="mt-0.5 text-xs text-muted-foreground">{item.variantTitle}</div>
              )}
          </div>

          <span className="text-sm font-mono tabular-nums font-semibold text-foreground shrink-0">
            {formattedLineTotal}
          </span>
        </div>

        {/* Unit price display if qty > 1 */}
        {item.effectiveQuantity > 1 && (
          <div className="mt-0.5 text-xs text-muted-foreground font-mono tabular-nums">
            {formattedUnitPrice} each
          </div>
        )}

        {/* Warning / Error Notices */}
        {isOutOfStock && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Out of stock. Please remove to checkout.</span>
          </div>
        )}

        {isQuantityReduced && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Only {item.availableQuantity} left in stock (adjusted from {item.requestedQuantity}).
            </span>
          </div>
        )}

        {isUnavailable && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Product is no longer available.</span>
          </div>
        )}

        {/* Stepper & Actions */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {/* Stepper with accessible tap targets (min 44px on mobile) */}
          <div className="inline-flex items-center rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity - 1)}
              disabled={disabled || item.requestedQuantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 text-center text-xs font-mono tabular-nums font-semibold text-foreground">
              {item.requestedQuantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity + 1)}
              disabled={disabled || item.requestedQuantity >= Math.min(10, item.availableQuantity)}
              aria-label="Increase quantity"
              className="flex h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Destructive and Secondary Actions: text links beneath/beside stepper per spec */}
          <div className="flex items-center gap-3 text-xs">
            {onSaveForLater && (
              <button
                type="button"
                onClick={onSaveForLater}
                disabled={disabled}
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-medium p-1 min-h-[44px] sm:min-h-0"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save for later</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              aria-label="Remove item"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors font-medium p-1 min-h-[44px] sm:min-h-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
