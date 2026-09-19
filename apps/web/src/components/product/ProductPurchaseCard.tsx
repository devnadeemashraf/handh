'use client';

import { Check, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import { Money } from '@hh/domain';

import type { PublicVariantItem } from '@hh/domain';

import { WishlistButton } from './WishlistButton';

export interface ProductPurchaseCardProps {
  variants: PublicVariantItem[];
  initialVariantId?: string | undefined;
  productId?: string | undefined;
}

export function ProductPurchaseCard({
  variants,
  initialVariantId,
  productId
}: ProductPurchaseCardProps) {
  const [selectedVariantId, setSelectedVariantId] = React.useState<string>(
    initialVariantId ?? variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  if (!selectedVariant) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Product unavailable</div>;
  }

  const priceFormatted = Money.fromMinor(selectedVariant.priceMinor, 'INR').format('en-IN');
  const isAvailable = selectedVariant.isAvailable && selectedVariant.availableQuantity > 0;
  const maxAllowed = Math.min(selectedVariant.availableQuantity, 5);

  const { addItem } = useCart();

  const handleAddToCart = async () => {
    if (!isAvailable || !selectedVariant) return;
    setAdded(true);
    await addItem(selectedVariant.id, quantity);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-6 sm:p-8">
        {/* Price Header */}
        <div className="mb-4 flex items-baseline gap-3">
          <span className="font-serif text-3xl sm:text-4xl font-semibold text-primary">
            {priceFormatted}
          </span>
          {selectedVariant.compareAtPriceMinor && (
            <span className="text-base text-muted-foreground line-through">
              {Money.fromMinor(selectedVariant.compareAtPriceMinor, 'INR').format('en-IN')}
            </span>
          )}
        </div>

        {/* Stock Status Urgency */}
        <div className="mb-6">
          {isAvailable ? (
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-800">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>
                In Stock &mdash; <strong>{selectedVariant.availableQuantity} pieces</strong>{' '}
                handcrafted &amp; ready to ship
              </span>
            </div>
          ) : (
            <Badge variant="destructive" className="text-xs uppercase tracking-wider">
              Currently Sold Out
            </Badge>
          )}
        </div>

        {/* Variant Selector (if > 1 variant) */}
        {variants.length > 1 && (
          <div className="mb-6">
            <label className="mb-2 block text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Variant
            </label>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVariantId(v.id);
                    setQuantity(1);
                  }}
                  className={cn(
                    'rounded-md px-4 py-2 text-xs font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedVariantId === v.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-card hover:bg-secondary text-foreground'
                  )}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity Selector */}
        {isAvailable && (
          <div className="mb-6">
            <label className="mb-2 block text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              Quantity
            </label>
            <div className="inline-flex items-center rounded-md border border-border bg-card">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="px-3.5 py-1.5 text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                &minus;
              </button>
              <span className="min-w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                disabled={quantity >= maxAllowed}
                className="px-3.5 py-1.5 text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Add to Bag Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          size="lg"
          className={cn(
            'w-full text-base font-semibold shadow-sm transition-all',
            added ? 'bg-emerald-800 hover:bg-emerald-900' : 'bg-primary hover:bg-primary/90'
          )}
        >
          {added ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              <span>Added to Bag</span>
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-5 w-5" />
              <span>{isAvailable ? 'Add to Shopping Bag' : 'Sold Out'}</span>
            </>
          )}
        </Button>

        {productId && (
          <div className="mt-3">
            <WishlistButton productId={productId} variantId={selectedVariantId} variant="button" />
          </div>
        )}

        {/* Trust Reassurances */}
        <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 shrink-0 text-accent" />
            <span>Manual packing &amp; express courier via India Post / DTDC</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
            <span>Encrypted Razorpay checkout &bull; Zero card detail storage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
