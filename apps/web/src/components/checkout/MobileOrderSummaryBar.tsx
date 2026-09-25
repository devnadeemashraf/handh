'use client';

import { ChevronDown, ChevronUp, ShoppingBag, Tag, Truck } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { cn } from '@/lib/utils';

import { calculateCheckoutFinancials, Money } from '@hh/domain';

import type { CartSummary } from '@hh/domain';

export interface MobileOrderSummaryBarProps {
  cartSummary: CartSummary;
  appliedPromo?: { code: string; discountMinor: number } | null;
  destinationState?: string;
  className?: string;
}

export function MobileOrderSummaryBar({
  cartSummary,
  appliedPromo,
  destinationState,
  className
}: MobileOrderSummaryBarProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const financials = calculateCheckoutFinancials(cartSummary.subtotalMinor, 'INR', {
    discountMinor: appliedPromo?.discountMinor ?? 0,
    destinationState
  });

  const totalFormatted = Money.fromMinor(financials.totalMinor, 'INR').format();
  const subtotalFormatted = Money.fromMinor(financials.subtotalMinor, 'INR').format();
  const shippingFormatted = financials.isFreeDelivery
    ? 'FREE'
    : Money.fromMinor(financials.shippingMinor, 'INR').format();

  return (
    <div
      className={cn(
        'lg:hidden border-b border-border-subtle bg-surface-sunken/60 transition-colors',
        className
      )}
    >
      {/* Tappable summary toggle bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="mobile-order-summary-content"
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-text-primary hover:bg-surface-sunken transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-royal"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-royal shrink-0" aria-hidden="true" />
          <span className="font-medium text-royal">
            {isExpanded ? 'Hide order summary' : 'Order summary'}
          </span>
          <span className="text-text-tertiary">
            ({cartSummary.totalQuantity} {cartSummary.totalQuantity === 1 ? 'piece' : 'pieces'})
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-royal" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-royal" />
          )}
        </div>

        <span className="font-mono tabular-nums font-semibold text-text-primary text-sm">
          {totalFormatted}
        </span>
      </button>

      {/* Expandable itemized view */}
      {isExpanded && (
        <div
          id="mobile-order-summary-content"
          className="px-4 pb-4 pt-2 border-t border-border-subtle space-y-4 animate-in fade-in-50 duration-fast"
        >
          {/* Items list */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border-subtle pr-1">
            {cartSummary.items.map((item) => (
              <div key={item.variantId} className="flex items-center gap-3 py-2.5">
                <div className="relative w-11 h-14 aspect-[4/5] shrink-0 overflow-hidden rounded-md border border-border-subtle bg-surface">
                  {item.primaryImageUrl ? (
                    <Image
                      src={item.primaryImageUrl}
                      alt={item.productTitle}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-royal">
                      H&amp;H
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="truncate text-xs font-medium text-text-primary">
                    {item.productTitle}
                  </div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    {item.variantTitle &&
                    item.variantTitle !== 'Default' &&
                    item.variantTitle !== 'Default Variant'
                      ? `${item.variantTitle} · `
                      : ''}
                    Qty: {item.effectiveQuantity}
                  </div>
                </div>

                <div className="text-xs font-mono tabular-nums font-semibold text-text-primary shrink-0">
                  {Money.fromMinor(item.lineTotalMinor, 'INR').format()}
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown rows */}
          <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-medium text-text-primary">
                {subtotalFormatted}
              </span>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-status-success font-medium">
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Promo ({appliedPromo.code})</span>
                </div>
                <span className="font-mono tabular-nums">
                  -{Money.fromMinor(appliedPromo.discountMinor, 'INR').format()}
                </span>
              </div>
            )}

            <div className="flex justify-between text-text-secondary">
              <div className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                <span>Courier Delivery</span>
              </div>
              <span
                className={
                  financials.isFreeDelivery
                    ? 'font-semibold text-status-success'
                    : 'font-mono tabular-nums text-text-primary'
                }
              >
                {shippingFormatted}
              </span>
            </div>

            {financials.taxMinor > 0 && (
              <div className="flex justify-between text-text-tertiary text-[11px]">
                <span>Statutory GST Included</span>
                <span className="font-mono tabular-nums">
                  {Money.fromMinor(financials.taxMinor, 'INR').format()}
                </span>
              </div>
            )}

            <div className="border-t border-border-subtle pt-2 flex justify-between items-baseline font-semibold text-sm">
              <span className="text-text-primary">Total</span>
              <span className="font-mono tabular-nums text-royal">{totalFormatted}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
