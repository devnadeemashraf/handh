'use client';

import { CheckCircle2, Truck } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

import { DEFAULT_FREE_SHIPPING_THRESHOLD_MINOR, Money } from '@hh/domain';

export interface FreeShippingBarProps {
  subtotalMinor: number;
  thresholdMinor?: number;
  className?: string;
}

export function FreeShippingBar({
  subtotalMinor,
  thresholdMinor = DEFAULT_FREE_SHIPPING_THRESHOLD_MINOR,
  className
}: FreeShippingBarProps) {
  const isFree = subtotalMinor >= thresholdMinor;
  const remainingMinor = Math.max(0, thresholdMinor - subtotalMinor);
  const percent = Math.min(100, Math.round((subtotalMinor / thresholdMinor) * 100));
  const remainingFormatted = Money.fromMinor(remainingMinor, 'INR').format();

  return (
    <div
      role="region"
      aria-label="Free shipping progress"
      className={cn(
        'rounded-md border p-3.5 transition-colors duration-fast',
        isFree
          ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
          : 'border-primary/20 bg-primary/5 text-foreground',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-2 font-medium">
          {isFree ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <Truck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span>
            {isFree ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                You&apos;ve unlocked Free Express Delivery!
              </span>
            ) : (
              <span>
                Add{' '}
                <strong className="font-mono tabular-nums font-semibold text-primary">
                  {remainingFormatted}
                </strong>{' '}
                more for free express delivery
              </span>
            )}
          </span>
        </div>
        <span className="font-mono tabular-nums text-[11px] text-muted-foreground shrink-0">
          {percent}%
        </span>
      </div>

      {/* Progress track */}
      <div
        className="h-1 w-full bg-border-subtle overflow-hidden rounded-sm"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Free shipping eligibility progress"
      >
        <div
          className={cn(
            'h-full transition-all duration-300 ease-decelerate',
            isFree ? 'bg-emerald-600' : 'bg-primary'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
