'use client';

import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { triggerHaptic } from '@/lib/haptic';

import { type CartItemDetail, Money, type ServiceControlConfig } from '@hh/domain';

import { CartComplementary } from './CartComplementary';
import { CartItemRow } from './CartItemRow';
import { type AppliedPromo, CartPromoCode } from './CartPromoCode';
import { FreeShippingBar } from './FreeShippingBar';
import { type SavedCartItem, SavedForLater } from './SavedForLater';

const SAVED_ITEMS_KEY = 'hh_saved_for_later';

export function CartView() {
  const { cartSummary, updateQuantity, removeItem, addItem, isLoading, totalItemCount } = useCart();
  const { toast } = useToast();

  const [serviceControl, setServiceControl] = React.useState<ServiceControlConfig | null>(null);
  const [appliedPromo, setAppliedPromo] = React.useState<AppliedPromo | null>(null);
  const [savedItems, setSavedItems] = React.useState<SavedCartItem[]>([]);

  // Load saved for later items from local storage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ITEMS_KEY);
      if (raw) {
        setSavedItems(JSON.parse(raw));
      }
    } catch {
      // ignore JSON storage errors
    }
  }, []);

  const saveSavedItems = (items: SavedCartItem[]) => {
    setSavedItems(items);
    try {
      localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.serviceControl) {
          setServiceControl(data.serviceControl);
        }
      })
      .catch(() => {});
  }, []);

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

  const isCheckoutReady = (cartSummary?.isValidForCheckout ?? false) && !isServicePaused;

  const subtotalMinor = cartSummary?.subtotalMinor ?? 0;
  const discountMinor = appliedPromo?.discountMinor ?? 0;
  const finalTotalMinor = Math.max(0, subtotalMinor - discountMinor);

  const subtotalFormatted = Money.fromMinor(subtotalMinor, 'INR').format();
  const totalFormatted = Money.fromMinor(finalTotalMinor, 'INR').format();
  const discountFormatted = Money.fromMinor(discountMinor, 'INR').format();

  // Handle Remove with 4s Undo Toast per spec
  const handleRemoveItem = (item: CartItemDetail) => {
    removeItem(item.variantId);
    triggerHaptic('light');

    toast({
      message: `${item.productTitle} removed`,
      variant: 'default',
      action: {
        label: 'Undo',
        onClick: () => {
          addItem(item.variantId, item.effectiveQuantity);
          triggerHaptic('selection');
        }
      }
    });
  };

  // Handle Save for Later
  const handleSaveForLater = (item: CartItemDetail) => {
    const savedEntry: SavedCartItem = {
      variantId: item.variantId,
      productId: item.productId,
      productSlug: item.productSlug,
      productTitle: item.productTitle,
      variantTitle: item.variantTitle ?? null,
      priceMinor: item.priceMinor,
      currency: item.currency,
      primaryImageUrl: item.primaryImageUrl ?? null
    };

    saveSavedItems([...savedItems.filter((i) => i.variantId !== item.variantId), savedEntry]);
    removeItem(item.variantId);
    triggerHaptic('selection');

    toast({
      message: 'Moved to Saved for Later',
      variant: 'info'
    });
  };

  const handleMoveToBag = (savedItem: SavedCartItem) => {
    addItem(savedItem.variantId, 1);
    saveSavedItems(savedItems.filter((i) => i.variantId !== savedItem.variantId));
    triggerHaptic('medium');

    toast({
      message: `${savedItem.productTitle} moved to bag`,
      variant: 'success'
    });
  };

  const handleRemoveSaved = (variantId: string) => {
    saveSavedItems(savedItems.filter((i) => i.variantId !== variantId));
  };

  // Loading skeleton state while fetching cart details
  if (isLoading && (!cartSummary || cartSummary.items.length === 0) && totalItemCount > 0) {
    return (
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="animate-pulse space-y-6 max-w-2xl mx-auto py-12">
          <div className="h-8 bg-muted rounded-sm w-1/3" />
          <div className="h-24 bg-muted rounded-md" />
          <div className="h-24 bg-muted rounded-md" />
        </div>
      </main>
    );
  }

  // Empty Cart State per 11_UX_STATE_CATALOGUE.md
  if (!cartSummary || cartSummary.items.length === 0) {
    return (
      <main className="mx-auto max-w-lg w-full flex-1 px-4 py-20 sm:py-28 text-center">
        <div className="bg-card rounded-md border border-border p-8 shadow-sm">
          <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center mx-auto mb-5 text-muted-foreground">
            <ShoppingBag className="h-7 w-7" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Your bag is empty
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Everything you add will show up here.
          </p>
          <Button
            asChild
            size="lg"
            onClick={() => triggerHaptic('selection')}
            className="w-full sm:w-auto px-8 h-11 text-sm font-medium rounded-md active:scale-[0.98]"
          >
            <Link href="/shop">Start Shopping</Link>
          </Button>

          {/* Render Saved For Later if any exist */}
          {savedItems.length > 0 && (
            <div className="mt-8 text-left">
              <SavedForLater
                items={savedItems}
                onMoveToBag={handleMoveToBag}
                onRemove={handleRemoveSaved}
              />
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32 lg:pb-12">
      {/* Top Bar: Back-Chevron & Bag Count in Title per spec */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-6 sm:mb-8 border-b border-border pb-4">
        <div>
          <Link
            href="/shop"
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-primary transition-colors mb-2.5 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Continue Shopping</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Your Bag ({totalItemCount})
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Truck className="h-4 w-4 text-primary shrink-0" />
          <span>Complimentary express shipping across India</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Free Shipping Progress + Line Items + Recommendations + Saved for Later */}
        <div className="lg:col-span-7 space-y-6">
          {/* Free Shipping Progress Alert Banner */}
          <FreeShippingBar subtotalMinor={subtotalMinor} />

          {/* Line items container */}
          <div className="bg-card rounded-md border border-border p-4 sm:p-6 shadow-sm">
            <div className="border-b border-border pb-3 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Handcrafted Pieces
              </span>
              <span className="text-xs text-muted-foreground">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="divide-y divide-border-subtle">
              {cartSummary.items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={(newQty) => updateQuantity(item.variantId, newQty)}
                  onRemove={() => handleRemoveItem(item)}
                  onSaveForLater={() => handleSaveForLater(item)}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Saved for Later Section */}
          {savedItems.length > 0 && (
            <SavedForLater
              items={savedItems}
              onMoveToBag={handleMoveToBag}
              onRemove={handleRemoveSaved}
            />
          )}

          {/* Curated Complementary Products Carousel */}
          <CartComplementary />
        </div>

        {/* Right Column (Desktop Sticky Summary Card) */}
        <div className="lg:col-span-5 bg-card rounded-md border border-border p-6 sm:p-8 shadow-sm lg:sticky lg:top-24 space-y-6">
          <h2 className="font-serif text-xl font-semibold text-foreground pb-3 border-b border-border">
            Order Summary
          </h2>

          {/* Promo Code Input */}
          <CartPromoCode
            subtotalMinor={subtotalMinor}
            appliedPromo={appliedPromo}
            onApply={setAppliedPromo}
            onRemove={() => setAppliedPromo(null)}
            disabled={isLoading}
          />

          {/* Price Breakdown */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums font-semibold text-foreground">
                {subtotalFormatted}
              </span>
            </div>

            {appliedPromo && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount ({appliedPromo.code})</span>
                <span className="font-mono tabular-nums font-semibold">-{discountFormatted}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground">
              <span>Courier Delivery</span>
              <span className="text-primary font-medium">Calculated at checkout</span>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-baseline">
              <div>
                <span className="text-base font-semibold text-foreground">Estimated Total</span>
                <p className="text-[11px] text-muted-foreground">Inclusive of statutory taxes</p>
              </div>
              <span className="font-serif text-2xl font-bold font-mono tabular-nums text-foreground">
                {totalFormatted}
              </span>
            </div>
          </div>

          {/* Maintenance Notice */}
          {isServicePaused && serviceControl && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-md flex flex-col gap-1 text-foreground">
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <Clock className="h-4 w-4 text-amber-800 dark:text-amber-400" />
                <span>{serviceControl.headline}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {serviceControl.maintenanceNotice}
              </p>
            </div>
          )}

          {/* Checkout CTA */}
          <Button
            asChild={isCheckoutReady}
            disabled={!isCheckoutReady}
            size="lg"
            onClick={() => {
              if (isCheckoutReady) {
                triggerHaptic('medium');
              }
            }}
            className="w-full h-12 text-base font-medium gap-2 rounded-md active:scale-[0.98] transition-transform duration-150"
          >
            {isCheckoutReady ? (
              <Link href="/checkout">
                <span>
                  {isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>{isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}</span>
            )}
          </Button>

          {!isCheckoutReady && !isServicePaused && (
            <p className="text-xs text-destructive text-center font-medium">
              Please resolve stock notices above before proceeding.
            </p>
          )}

          {/* Trust Guarantees */}
          <div className="border-t border-border pt-5 flex flex-col gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              <span>Limited Batch Quality Guarantee</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-primary shrink-0" />
              <span>Direct Courier Dispatch across India</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span>Secure Razorpay Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar per spec 07_CART_AND_CHECKOUT.md §7.1 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-lg">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total
            </span>
            <span className="font-serif text-xl font-bold font-mono tabular-nums text-foreground">
              {totalFormatted}
            </span>
          </div>

          <Button
            asChild={isCheckoutReady}
            disabled={!isCheckoutReady}
            size="lg"
            onClick={() => {
              if (isCheckoutReady) {
                triggerHaptic('medium');
              }
            }}
            className="flex-1 h-12 text-sm font-semibold rounded-md shadow-sm"
          >
            {isCheckoutReady ? (
              <Link href="/checkout" className="flex items-center justify-center gap-2">
                <span>Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>Checkout</span>
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}
