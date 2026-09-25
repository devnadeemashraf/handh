'use client';

import { Check, Loader2, ShoppingBag, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import { type CurrencyCode, Money, type PublicVariantItem } from '@hh/domain';

export interface StickyPurchaseBarProps {
  selectedVariant: PublicVariantItem;
  quantity: number;
  productTitle: string;
  isVisible: boolean;
  onOpenNotifyModal?: () => void;
}

export function StickyPurchaseBar({
  selectedVariant,
  quantity,
  productTitle,
  isVisible,
  onOpenNotifyModal
}: StickyPurchaseBarProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const [isAdding, setIsAdding] = React.useState(false);
  const [isBuyingNow, setIsBuyingNow] = React.useState(false);
  const [hasAdded, setHasAdded] = React.useState(false);

  const currency = (selectedVariant.currency as CurrencyCode) || 'INR';
  const priceFormatted = Money.fromMinor(selectedVariant.priceMinor, currency).format('en-IN');
  const isAvailable = selectedVariant.isAvailable && selectedVariant.availableQuantity > 0;

  const handleAddToCart = async () => {
    if (!isAvailable || isAdding) return;
    try {
      setIsAdding(true);
      await addItem(selectedVariant.id, quantity);
      setHasAdded(true);
      toast({
        message: `Added ${quantity > 1 ? `${quantity}x ` : ''}${productTitle} to your bag`,
        variant: 'success',
        action: {
          label: 'View Bag',
          onClick: openCart
        }
      });
      setTimeout(() => setHasAdded(false), 2000);
    } catch {
      toast({
        message: 'Could not add item to bag. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAvailable || isBuyingNow) return;
    try {
      setIsBuyingNow(true);
      await addItem(selectedVariant.id, quantity);
      router.push('/checkout');
    } catch {
      toast({
        message: 'Could not process instant checkout. Please try again.',
        variant: 'error'
      });
      setIsBuyingNow(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="Sticky Buying Bar"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle p-3 shadow-lg lg:hidden transition-all duration-fast ease-decelerate pb-[calc(0.75rem+env(safe-area-inset-bottom))]',
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        {/* Left: Price summary */}
        <div className="flex flex-col min-w-0 shrink-0">
          <span className="font-mono text-base font-semibold tabular-nums text-text-primary">
            {priceFormatted}
          </span>
          <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
            MRP (incl. taxes)
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-1 items-center gap-2">
          {isAvailable ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddToCart}
                disabled={isAdding || isBuyingNow}
                className="flex-1 h-11 text-xs font-semibold select-none"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : hasAdded ? (
                  <>
                    <Check className="mr-1.5 h-4 w-4 text-emerald-600" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="mr-1.5 h-4 w-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBuyNow}
                disabled={isAdding || isBuyingNow}
                className="flex-1 h-11 text-xs font-semibold select-none"
              >
                {isBuyingNow ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="mr-1.5 h-4 w-4 fill-current" />
                    <span>Buy Now</span>
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenNotifyModal}
              className="w-full h-11 text-xs font-semibold select-none"
            >
              Notify Me When Available
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
