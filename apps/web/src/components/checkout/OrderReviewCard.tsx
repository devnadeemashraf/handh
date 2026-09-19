'use client';

import { Clock, Loader2, ShieldCheck, Sparkles, Tag, Truck, X } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { calculateCheckoutFinancials, Money } from '@hh/domain';

import type { CartSummary } from '@hh/domain';

export interface OrderReviewCardProps {
  cartSummary: CartSummary;
  isSubmitting: boolean;
  onSubmit: (couponCode?: string) => void;
  disabled?: boolean;
}

export function OrderReviewCard({
  cartSummary,
  isSubmitting,
  onSubmit,
  disabled = false
}: OrderReviewCardProps) {
  const [couponInput, setCouponInput] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<{
    code: string;
    discountMinor: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotalMinor: cartSummary.subtotalMinor
        })
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponError(data.reason || 'Invalid promotional code.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountMinor: data.discountMinor
        });
        setCouponError(null);
      }
    } catch {
      setCouponError('Failed to verify promotional code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const financials = calculateCheckoutFinancials(cartSummary.subtotalMinor, 'INR', {
    discountMinor: appliedCoupon?.discountMinor ?? 0
  });

  const subtotalFormatted = Money.fromMinor(financials.subtotalMinor, 'INR').format();
  const shippingFormatted = financials.isFreeDelivery
    ? 'FREE'
    : Money.fromMinor(financials.shippingMinor, 'INR').format();
  const totalFormatted = Money.fromMinor(financials.totalMinor, 'INR').format();
  const remainingForFreeFormatted = Money.fromMinor(
    financials.remainingForFreeDeliveryMinor,
    'INR'
  ).format();

  return (
    <Card className="sticky top-24 border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <h2 className="mb-4 border-b border-border pb-3 font-serif text-xl font-semibold text-primary">
          Order Summary ({cartSummary.totalQuantity}{' '}
          {cartSummary.totalQuantity === 1 ? 'piece' : 'pieces'})
        </h2>

        {/* Items Preview List */}
        <div className="max-h-64 overflow-y-auto pr-1 divide-y divide-border mb-4">
          {cartSummary.items.map((item) => (
            <div key={item.variantId} className="flex items-center gap-3 py-2.5">
              {/* Thumbnail */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/40">
                {item.primaryImageUrl ? (
                  <Image
                    src={item.primaryImageUrl}
                    alt={item.productTitle}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-accent">
                    H&amp;H
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-foreground">
                  {item.productTitle}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.variantTitle &&
                  item.variantTitle !== 'Default' &&
                  item.variantTitle !== 'Default Variant'
                    ? `${item.variantTitle} · `
                    : ''}
                  Qty: {item.effectiveQuantity}
                </div>
              </div>

              {/* Price */}
              <div className="text-sm font-semibold text-foreground">
                {Money.fromMinor(item.lineTotalMinor, 'INR').format()}
              </div>
            </div>
          ))}
        </div>

        {/* Free Delivery Incentive Prompt */}
        {!financials.isFreeDelivery && financials.remainingForFreeDeliveryMinor > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-accent/40 bg-secondary/60 p-2.5 text-xs text-secondary-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
            <span>
              Add <strong>{remainingForFreeFormatted}</strong> more to your order to unlock{' '}
              <strong>Free Express Delivery</strong>!
            </span>
          </div>
        )}

        {/* Coupon Code Entry Form */}
        <div className="mb-4">
          {!appliedCoupon ? (
            <form onSubmit={handleApplyCoupon} className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="PROMO CODE (e.g. WELCOME10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={disabled || isSubmitting || couponLoading}
                  aria-label="Promotional Code"
                  className="font-mono text-xs uppercase tracking-wider h-10"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!couponInput.trim() || disabled || isSubmitting || couponLoading}
                  className="shrink-0 h-10 text-xs font-semibold px-4"
                >
                  {couponLoading ? 'Checking...' : 'Apply'}
                </Button>
              </div>
              {couponError && <div className="text-xs text-destructive mt-1">{couponError}</div>}
            </form>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-emerald-700" />
                <span>{appliedCoupon.code} applied</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                aria-label="Remove promo code"
                className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Financial Breakdown Table */}
        <div className="space-y-2.5 text-sm mb-4">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-semibold text-foreground">{subtotalFormatted}</span>
          </div>

          {/* Applied Coupon Discount Row */}
          {financials.discountMinor > 0 && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span>Coupon Discount ({appliedCoupon?.code})</span>
              </div>
              <span>&minus; {Money.fromMinor(financials.discountMinor, 'INR').format()}</span>
            </div>
          )}

          <div className="flex justify-between text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              <span>Standard Courier Delivery</span>
            </div>
            <span
              className={
                financials.isFreeDelivery
                  ? 'font-semibold text-emerald-700'
                  : 'font-semibold text-foreground'
              }
            >
              {shippingFormatted}
            </span>
          </div>

          <div className="border-t border-border pt-3 flex items-baseline justify-between">
            <div>
              <span className="font-semibold text-foreground text-base">Total to Pay</span>
              <div className="text-[11px] text-muted-foreground">
                Inclusive of all taxes &amp; delivery
              </div>
            </div>
            <span className="font-serif text-2xl font-bold text-primary">{totalFormatted}</span>
          </div>
        </div>

        {/* Inventory Lock Guarantee */}
        <div className="mb-5 flex items-start gap-2 rounded-md border border-primary/10 bg-primary/5 p-2.5 text-xs text-primary leading-relaxed">
          <Clock className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>15-Minute Reservation:</strong> Stock is reserved exclusively for you once order
            is initiated, preventing overselling.
          </span>
        </div>

        {/* Primary Submit Button */}
        <Button
          type="button"
          onClick={() => onSubmit(appliedCoupon?.code)}
          disabled={disabled || isSubmitting || !cartSummary.isValidForCheckout}
          size="lg"
          className="w-full text-base font-semibold shadow-md min-h-12"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Securing Stock &amp; Placing Order...</span>
            </>
          ) : (
            <span>Place Order &amp; Proceed to Pay</span>
          )}
        </Button>

        {/* Security & Reassurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>256-Bit Encrypted Secure Checkout</span>
        </div>
      </CardContent>
    </Card>
  );
}
