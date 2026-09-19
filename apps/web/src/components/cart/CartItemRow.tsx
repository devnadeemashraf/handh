'use client';

import { AlertCircle, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Money } from '@hh/domain';

import type { CartItemDetail } from '@hh/domain';

export interface CartItemRowProps {
  item: CartItemDetail;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false
}: CartItemRowProps) {
  const formattedUnitPrice = Money.fromMinor(item.priceMinor, 'INR').format();
  const formattedLineTotal = Money.fromMinor(item.lineTotalMinor, 'INR').format();

  const isOutOfStock = item.statusNotice === 'out_of_stock';
  const isQuantityReduced = item.statusNotice === 'quantity_reduced';
  const isUnavailable = item.statusNotice === 'unavailable';

  return (
    <div className="flex gap-4 py-4 border-b border-border items-start">
      {/* Thumbnail */}
      <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/40">
        {item.primaryImageUrl ? (
          <Image
            src={item.primaryImageUrl}
            alt={item.productTitle}
            fill
            sizes="72px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-1 text-center font-serif text-[11px] font-medium text-accent">
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
                className="block text-sm font-semibold text-primary hover:text-accent transition-colors leading-snug line-clamp-1"
              >
                {item.productTitle}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-foreground line-clamp-1">
                {item.productTitle}
              </span>
            )}
            {item.variantTitle &&
              item.variantTitle !== 'Default' &&
              item.variantTitle !== 'Default Variant' && (
                <div className="mt-0.5 text-xs text-muted-foreground">{item.variantTitle}</div>
              )}
          </div>

          <span className="text-sm font-semibold text-foreground shrink-0">
            {formattedLineTotal}
          </span>
        </div>

        {/* Unit price display if qty > 1 */}
        {item.effectiveQuantity > 1 && (
          <div className="mt-0.5 text-xs text-muted-foreground">{formattedUnitPrice} each</div>
        )}

        {/* Warning / Error Notices */}
        {isOutOfStock && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Out of stock. Please remove to checkout.</span>
          </div>
        )}

        {isQuantityReduced && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
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

        {/* Stepper & Remove controls */}
        <div className="mt-3 flex items-center justify-between">
          {/* Touch-Friendly Stepper (Mobile First: min 40x40px tap targets) */}
          <div className="inline-flex items-center rounded-md border border-border bg-card">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity - 1)}
              disabled={disabled || item.requestedQuantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-8 text-center text-xs font-semibold text-foreground">
              {item.requestedQuantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity + 1)}
              disabled={disabled || item.requestedQuantity >= Math.min(10, item.availableQuantity)}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove item"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
