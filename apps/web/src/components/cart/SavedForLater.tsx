'use client';

import { Bookmark, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { Money } from '@hh/domain';

export interface SavedCartItem {
  variantId: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  variantTitle?: string | null;
  priceMinor: number;
  currency: string;
  primaryImageUrl?: string | null;
}

export interface SavedForLaterProps {
  items: SavedCartItem[];
  onMoveToBag: (item: SavedCartItem) => void;
  onRemove: (variantId: string) => void;
  className?: string;
}

export function SavedForLater({ items, onMoveToBag, onRemove, className }: SavedForLaterProps) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="saved-for-later-heading"
      className={cn(
        'mt-8 pt-6 border-t border-border-subtle bg-surface-sunken/40 rounded-md p-4 sm:p-5',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
        <h2
          id="saved-for-later-heading"
          className="font-serif text-lg font-semibold text-text-primary"
        >
          Saved for Later ({items.length})
        </h2>
      </div>

      <div className="divide-y divide-border-subtle">
        {items.map((item) => {
          const formattedPrice = Money.fromMinor(item.priceMinor, 'INR').format();

          return (
            <div
              key={item.variantId}
              className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-15 aspect-[4/5] shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-royal">
                      H&amp;H
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="block text-sm font-medium text-text-primary hover:text-royal transition-colors line-clamp-1"
                  >
                    {item.productTitle}
                  </Link>
                  {item.variantTitle && (
                    <div className="text-xs text-text-tertiary">{item.variantTitle}</div>
                  )}
                  <div className="font-mono tabular-nums text-xs font-semibold text-text-primary mt-0.5">
                    {formattedPrice}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onMoveToBag(item)}
                  className="h-8 px-3 text-xs gap-1.5 rounded-md font-medium"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Move to Bag</span>
                </Button>
                <button
                  type="button"
                  onClick={() => onRemove(item.variantId)}
                  aria-label={`Remove ${item.productTitle} from saved`}
                  className="p-2 text-text-tertiary hover:text-status-error transition-colors rounded-sm min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
