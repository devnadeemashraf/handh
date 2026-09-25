'use client';

import { Loader2, Tag, X } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { Money } from '@hh/domain';

export interface AppliedPromo {
  code: string;
  discountMinor: number;
}

export interface CartPromoCodeProps {
  subtotalMinor: number;
  appliedPromo: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function CartPromoCode({
  subtotalMinor,
  appliedPromo,
  onApply,
  onRemove,
  disabled = false,
  className
}: CartPromoCodeProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const inputEl = formEl.querySelector('input') as HTMLInputElement | null;
    const rawCode = code || inputEl?.value || '';
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          subtotalMinor
        })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.reason || "This code isn't valid");
      } else {
        onApply({
          code: data.coupon.code,
          discountMinor: data.discountMinor
        });
        setCode('');
        setError(null);
        setIsOpen(false);
      }
    } catch {
      setError('Unable to verify promo code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedPromo) {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-foreground',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Tag
            className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span className="font-medium">
            <span className="font-mono uppercase font-semibold">{appliedPromo.code}</span> applied (
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
              -{Money.fromMinor(appliedPromo.discountMinor, 'INR').format()}
            </span>
            )
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove promo code ${appliedPromo.code}`}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className={cn('text-xs', className)}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          className="text-primary hover:underline font-medium inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        >
          <Tag className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Have a promo code?</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder="PROMO CODE"
          disabled={disabled || isLoading}
          aria-label="Promotional Code"
          className="font-mono text-xs uppercase tracking-wider h-10 flex-1 rounded-md"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!code.trim() || disabled || isLoading}
          className="shrink-0 h-10 px-4 text-xs font-semibold rounded-md min-w-[70px]"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setError(null);
            setCode('');
          }}
          disabled={disabled || isLoading}
          aria-label="Cancel promo code"
          className="h-10 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
        >
          <X className="h-4 w-4" />
        </Button>
      </form>
      {error && (
        <p className="text-xs text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
