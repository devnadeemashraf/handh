'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription } from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';

import { Money } from '@hh/domain';

import { CartDrawerFooter } from './CartDrawerFooter';
import { CartDrawerHeader } from './CartDrawerHeader';
import { CartItemRow } from './CartItemRow';
import { useCartDrawerService } from './useCartDrawerService';

export function CartDrawer() {
  const { isOpen, closeCart, cartSummary, totalItemCount, updateQuantity, removeItem, isLoading } =
    useCart();

  const { serviceControl, isServicePaused } = useCartDrawerService(isOpen);

  const subtotalFormatted = cartSummary
    ? Money.fromMinor(cartSummary.subtotalMinor, 'INR').format()
    : '₹0';

  const isCheckoutReady = (cartSummary?.isValidForCheckout ?? false) && !isServicePaused;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <CartDrawerHeader totalItemCount={totalItemCount} />

        <SheetDescription className="sr-only">
          Review your items in the shopping bag before proceeding to checkout.
        </SheetDescription>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {cartSummary && cartSummary.items.length > 0 ? (
            <div className="divide-y divide-border">
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
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary/40 text-accent">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-primary mb-2">
                Your Bag is Empty
              </h3>
              <p className="mb-6 max-w-xs text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Discover our signature modest wear accessories crafted in limited batches.
              </p>
              <Button onClick={closeCart} size="sm" className="rounded-full px-6">
                Explore Collection
              </Button>
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        {cartSummary && cartSummary.items.length > 0 && (
          <CartDrawerFooter
            subtotalFormatted={subtotalFormatted}
            isCheckoutReady={isCheckoutReady}
            isServicePaused={isServicePaused}
            serviceControl={serviceControl}
            onClose={closeCart}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
