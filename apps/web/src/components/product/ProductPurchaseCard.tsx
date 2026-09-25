'use client';

import {
  Check,
  Loader2,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import { type CurrencyCode, Money, type PublicVariantItem } from '@hh/domain';

import { NotifyMeForm } from './NotifyMeForm';
import { SizeGuideModal } from './SizeGuideModal';
import { WishlistButton } from './WishlistButton';

export interface ProductPurchaseCardProps {
  variants: PublicVariantItem[];
  initialVariantId?: string | undefined;
  productId?: string | undefined;
  productTitle?: string | undefined;
  onVariantChange?: (variant: PublicVariantItem) => void;
  onControlsVisibilityChange?: (isVisible: boolean) => void;
}

const COLOR_MAP: Record<string, string> = {
  emerald: '#0d5c3a',
  'emerald green': '#0d5c3a',
  green: '#0d5c3a',
  royale: '#c59b27',
  'royale gold': '#c59b27',
  gold: '#c59b27',
  black: '#1f1b18',
  'onyx black': '#1f1b18',
  ruby: '#9e1b32',
  'ruby red': '#9e1b32',
  red: '#9e1b32',
  navy: '#1b263b',
  'midnight navy': '#1b263b',
  blue: '#1b263b',
  pearl: '#f4f1ea',
  'pearl white': '#f4f1ea',
  white: '#fcfcfc',
  champagne: '#f7e7ce',
  ivory: '#fffff0',
  rose: '#b76e79',
  'rose gold': '#b76e79',
  silver: '#c0c0c0',
  burgundy: '#800020',
  plum: '#4b0082'
};

function getColorHex(title: string): string | null {
  const lower = title.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower]!;
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export function ProductPurchaseCard({
  variants,
  initialVariantId,
  productId,
  productTitle = 'Piece',
  onVariantChange,
  onControlsVisibilityChange
}: ProductPurchaseCardProps) {
  const router = useRouter();
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const containerRef = React.useRef<HTMLDivElement>(null);

  const [selectedVariantId, setSelectedVariantId] = React.useState<string>(
    initialVariantId ?? variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = React.useState(1);
  const [isAdding, setIsAdding] = React.useState(false);
  const [isBuyingNow, setIsBuyingNow] = React.useState(false);
  const [added, setAdded] = React.useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = React.useState(false);

  // Sync initialVariantId if it changes
  React.useEffect(() => {
    if (initialVariantId) {
      setSelectedVariantId(initialVariantId);
    }
  }, [initialVariantId]);

  // Observer to notify sticky bar when in-page controls scroll out of view
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || !onControlsVisibilityChange || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          onControlsVisibilityChange(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onControlsVisibilityChange]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  const handleVariantSelect = (variant: PublicVariantItem) => {
    setSelectedVariantId(variant.id);
    setQuantity(1);
    onVariantChange?.(variant);
  };

  if (!selectedVariant) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Product unavailable</div>;
  }

  const currency = (selectedVariant.currency as CurrencyCode) || 'INR';
  const priceFormatted = Money.fromMinor(selectedVariant.priceMinor, currency).format('en-IN');
  const isAvailable = selectedVariant.isAvailable && selectedVariant.availableQuantity > 0;
  const maxAllowed = Math.min(selectedVariant.availableQuantity, 5);

  // Check if variants represent colors
  const hasColorVariants = variants.some((v) => getColorHex(v.title) !== null);

  const handleAddToCart = async () => {
    if (!isAvailable || !selectedVariant || isAdding) return;
    setAdded(true);
    try {
      setIsAdding(true);
      await addItem(selectedVariant.id, quantity);
      toast({
        message: `Added ${quantity > 1 ? `${quantity}x ` : ''}${productTitle} (${selectedVariant.title}) to your bag`,
        variant: 'success',
        action: {
          label: 'View Bag',
          onClick: openCart
        }
      });
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setAdded(false);
      toast({
        message: 'Could not add item to bag. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAvailable || !selectedVariant || isBuyingNow) return;
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
    <>
      <div ref={containerRef}>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {/* Price Header with Statutory Legal Metrology MRP Notice */}
            <div className="mb-4">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl sm:text-4xl font-semibold text-primary">
                  {priceFormatted}
                </span>
                {selectedVariant.compareAtPriceMinor && (
                  <span className="text-base text-muted-foreground line-through">
                    MRP{' '}
                    {Money.fromMinor(selectedVariant.compareAtPriceMinor, currency).format('en-IN')}
                  </span>
                )}
                {selectedVariant.compareAtPriceMinor &&
                  selectedVariant.compareAtPriceMinor > selectedVariant.priceMinor && (
                    <Badge
                      variant="secondary"
                      className="bg-sale/10 text-sale border-transparent text-[11px] font-semibold"
                    >
                      Sale
                    </Badge>
                  )}
              </div>
              <span className="mt-1 block text-xs font-medium text-muted-foreground">
                MRP (Inclusive of all taxes)
              </span>
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
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {hasColorVariants ? 'Color' : 'Variant'}:{' '}
                    <span className="normal-case font-medium text-foreground">
                      {selectedVariant.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline select-none"
                  >
                    <Ruler className="h-3 w-3" />
                    <span>Size guide</span>
                  </button>
                </div>

                {hasColorVariants ? (
                  /* Color Swatches (32px circular with 2px offset ring) */
                  <div className="flex flex-wrap items-center gap-3 py-1">
                    {variants.map((v) => {
                      const hex = getColorHex(v.title) || '#888888';
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleVariantSelect(v)}
                          title={`${v.title}${!v.isAvailable ? ' (Sold Out)' : ''}`}
                          aria-label={v.title}
                          className={cn(
                            'group relative h-8 w-8 rounded-full border border-border transition-all duration-fast focus-visible:outline-none select-none',
                            isSelected &&
                              'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105',
                            !v.isAvailable && 'opacity-60'
                          )}
                          style={{ backgroundColor: hex }}
                        >
                          {!v.isAvailable && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="h-0.5 w-6 rotate-45 bg-white/80 shadow-xs" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard Variant Tap Targets */
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleVariantSelect(v)}
                          className={cn(
                            'min-w-[44px] min-h-[44px] rounded-md px-4 py-2 text-xs font-medium transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'border border-border bg-card hover:bg-secondary text-foreground',
                            !v.isAvailable && 'line-through opacity-50 bg-secondary/30'
                          )}
                        >
                          {v.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector or Notify Me Inline */}
            {isAvailable ? (
              <div className="mb-6">
                <label className="mb-2 block text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Quantity
                </label>
                <div className="inline-flex items-center rounded-md border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isAdding}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <span className="min-w-10 text-center font-mono text-sm font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                    disabled={quantity >= maxAllowed || isAdding}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-base text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <NotifyMeForm variantTitle={selectedVariant.title} />
              </div>
            )}

            {/* In-Page Purchasing Actions */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable || isAdding || isBuyingNow}
                size="lg"
                variant={added ? 'default' : 'secondary'}
                className={cn(
                  'w-full min-h-[48px] text-base font-semibold shadow-sm transition-all',
                  added && 'bg-emerald-800 hover:bg-emerald-900 text-white'
                )}
              >
                {added ? (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    <span>Added to Bag</span>
                  </>
                ) : isAdding ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    <span>{isAvailable ? 'Add to Shopping Bag' : 'Sold Out'}</span>
                  </>
                )}
              </Button>

              {isAvailable && (
                <Button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isAdding || isBuyingNow}
                  size="lg"
                  variant="default"
                  className="w-full min-h-[48px] text-base font-semibold shadow-sm select-none"
                >
                  {isBuyingNow ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="mr-2 h-5 w-5 fill-current" />
                      <span>Buy Now</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {productId && (
              <div className="mt-3">
                <WishlistButton
                  productId={productId}
                  variantId={selectedVariantId}
                  variant="button"
                />
              </div>
            )}

            {/* Trust Reassurances Strip */}
            <div className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 shrink-0 text-accent" />
                <span>Express courier via India Post / DTDC (3–5 business days)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                <span>Encrypted Razorpay checkout &bull; 7-day hassle-free returns</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </>
  );
}
