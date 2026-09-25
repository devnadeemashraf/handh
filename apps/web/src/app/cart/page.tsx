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
import { useEffect, useState } from 'react';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { triggerHaptic } from '@/lib/haptic';

import { Money, type ServiceControlConfig } from '@hh/domain';

export default function CartPage() {
  const { cartSummary, updateQuantity, removeItem, isLoading, totalItemCount } = useCart();
  const [serviceControl, setServiceControl] = useState<ServiceControlConfig | null>(null);

  useEffect(() => {
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.serviceControl) {
          setServiceControl(data.serviceControl);
        }
      })
      .catch(() => {});
  }, []);

  const subtotalFormatted = cartSummary
    ? Money.fromMinor(cartSummary.subtotalMinor, 'INR').format()
    : '₹0';

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

  const isCheckoutReady = (cartSummary?.isValidForCheckout ?? false) && !isServicePaused;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Your Collection Bag
          </h1>
          {totalItemCount > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>

        {cartSummary && cartSummary.items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-7 bg-card rounded-2xl border border-border/80 p-4 sm:p-6 shadow-sm">
              <div className="border-b border-border/60 pb-3 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Handcrafted Pieces
                </span>
              </div>

              <div className="divide-y divide-border/60">
                {cartSummary.items.map((item) => (
                  <CartItemRow
                    key={item.variantId}
                    item={item}
                    onUpdateQuantity={(newQty) => updateQuantity(item.variantId, newQty)}
                    onRemove={() => removeItem(item.variantId)}
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Right: Authoritative Order Summary Card */}
            <div className="lg:col-span-5 bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
              <h2 className="font-serif text-xl font-semibold text-foreground pb-4 border-b border-border/60 mb-5">
                Order Summary
              </h2>

              <div className="flex justify-between mb-3 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{subtotalFormatted}</span>
              </div>

              <div className="flex justify-between mb-4 text-sm">
                <span className="text-muted-foreground">Courier Delivery</span>
                <span className="text-accent font-medium">Calculated at checkout</span>
              </div>

              <div className="border-t border-border/60 pt-4 flex justify-between items-baseline mb-6">
                <span className="text-base font-semibold text-foreground">Estimated Total</span>
                <span className="font-serif text-2xl font-bold text-foreground">
                  {subtotalFormatted}
                </span>
              </div>

              {/* Customer Reassurance Maintenance Banner */}
              {isServicePaused && serviceControl && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-4 flex flex-col gap-1 text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{serviceControl.headline}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {serviceControl.maintenanceNotice}
                  </p>
                </div>
              )}

              {/* Checkout CTA */}
              <Button
                asChild={isCheckoutReady}
                disabled={!isCheckoutReady}
                onClick={() => {
                  if (isCheckoutReady) {
                    triggerHaptic('medium');
                  }
                }}
                className="w-full h-12 text-base font-medium gap-2 active:scale-[0.96] transition-transform duration-150"
              >
                {isCheckoutReady ? (
                  <Link href="/checkout">
                    <span>
                      {isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    {isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}
                  </span>
                )}
              </Button>

              {!isCheckoutReady && !isServicePaused && (
                <p className="text-xs text-destructive mt-2.5 text-center font-medium">
                  Please resolve stock warnings above before proceeding.
                </p>
              )}

              {/* Trust Guarantees */}
              <div className="mt-8 border-t border-border/60 pt-5 flex flex-col gap-3.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-accent shrink-0" />
                  <span>Limited Batch Quality Guarantee</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 text-foreground shrink-0" />
                  <span>Direct Courier Dispatch across India</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-foreground shrink-0" />
                  <span>Secure Razorpay Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-card rounded-2xl border border-border/80 max-w-lg mx-auto shadow-sm">
            <div className="h-16 w-16 rounded-full bg-muted/60 border border-border flex items-center justify-center mx-auto mb-5 text-muted-foreground">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Your Collection Bag is Empty
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Explore our artisanal handcrafted nose pieces and modest wear essentials.
            </p>
            <Button
              asChild
              onClick={() => triggerHaptic('selection')}
              className="px-8 h-11 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
            >
              <Link href="/">Explore Collection</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
