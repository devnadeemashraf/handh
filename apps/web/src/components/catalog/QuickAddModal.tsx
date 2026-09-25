'use client';

import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  ModalSheet,
  ModalSheetContent,
  ModalSheetDescription,
  ModalSheetHeader,
  ModalSheetTitle
} from '@/components/ui/modal-sheet';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import {
  type CurrencyCode,
  Money,
  type PublicProductDetail,
  type PublicProductListItem
} from '@hh/domain';

export interface QuickAddModalProps {
  product: PublicProductListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const [productDetail, setProductDetail] = React.useState<PublicProductDetail | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch full product details when opened
  React.useEffect(() => {
    if (!isOpen || !product) {
      setProductDetail(null);
      setSelectedVariantId(null);
      setQuantity(1);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    fetch(`/api/products/${product.slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!isMounted) return;
        if (json?.data) {
          const detail = json.data as PublicProductDetail;
          setProductDetail(detail);

          // Pre-select first available variant
          const firstAvailable = detail.variants.find((v) => v.isAvailable) || detail.variants[0];
          if (firstAvailable) {
            setSelectedVariantId(firstAvailable.id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load variants for quick add:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product]);

  if (!product) return null;

  const selectedVariant = productDetail?.variants.find((v) => v.id === selectedVariantId);
  const displayPriceMinor = selectedVariant
    ? selectedVariant.priceMinor
    : product.startingPriceMinor;
  const currency = (product.currency as CurrencyCode) || 'INR';
  const formattedPrice = Money.fromMinor(displayPriceMinor, currency).format('en-IN');
  const comparePriceMinor = selectedVariant?.compareAtPriceMinor ?? product.compareAtPriceMinor;
  const formattedComparePrice =
    comparePriceMinor && comparePriceMinor > displayPriceMinor
      ? Money.fromMinor(comparePriceMinor, currency).format('en-IN')
      : null;

  const handleAddToCart = async () => {
    const variantId = selectedVariantId || product.firstVariantId;
    if (!variantId) return;

    try {
      setIsSubmitting(true);
      await addItem(variantId, quantity);
      toast({
        message: `Added ${product.title} to your bag`,
        variant: 'success',
        action: {
          label: 'View Bag',
          onClick: openCart
        }
      });
      onClose();
    } catch {
      toast({
        message: 'Could not add item to bag. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalSheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalSheetContent className="max-w-md">
        <ModalSheetHeader>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-text-secondary">
            {product.categoryName || 'Curated Piece'}
          </span>
          <ModalSheetTitle className="text-base sm:text-lg font-serif">
            {product.title}
          </ModalSheetTitle>
          <ModalSheetDescription className="sr-only">
            Select variant and quantity to quickly add this item to your shopping bag
          </ModalSheetDescription>
        </ModalSheetHeader>

        {/* Product Snapshot */}
        <div className="flex gap-4 border-b border-border-subtle pb-4">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-sm bg-sunken">
            {product.primaryImageUrl ? (
              <Image
                src={product.primaryImageUrl}
                alt={product.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-base font-semibold tabular-nums text-text-primary">
                {formattedPrice}
              </span>
              {formattedComparePrice && (
                <span className="font-mono text-xs tabular-nums text-text-tertiary line-through">
                  {formattedComparePrice}
                </span>
              )}
            </div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider">
              MRP (incl. taxes)
            </span>
          </div>
        </div>

        {/* Variant Selectors */}
        <div className="space-y-4 py-4">
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-6 text-text-secondary">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-xs">Loading options...</span>
            </div>
          ) : productDetail && productDetail.variants.length > 1 ? (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                Select Option / Size
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {productDetail.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  const isAvailable = v.isAvailable;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={cn(
                        'flex items-center justify-between rounded-sm border p-2.5 text-xs font-medium transition-all text-left min-h-[44px]',
                        isSelected
                          ? 'border-royal bg-accent-royal-tint text-royal'
                          : 'border-border-subtle bg-surface text-text-primary hover:border-border-strong',
                        !isAvailable &&
                          'cursor-not-allowed opacity-40 line-through bg-sunken text-text-tertiary'
                      )}
                    >
                      <span className="truncate">{v.title}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
              Quantity
            </span>
            <div className="inline-flex h-9 items-center rounded-sm border border-border-subtle bg-surface">
              <button
                type="button"
                disabled={quantity <= 1 || isSubmitting}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-9 w-9 items-center justify-center text-text-primary hover:bg-sunken disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-10 text-center font-mono text-xs tabular-nums text-text-primary">
                {quantity}
              </span>
              <button
                type="button"
                disabled={quantity >= 10 || isSubmitting}
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="flex h-9 w-9 items-center justify-center text-text-primary hover:bg-sunken disabled:opacity-30 disabled:pointer-events-none"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={
              isSubmitting || (productDetail ? !selectedVariant?.isAvailable : !product.isAvailable)
            }
            onClick={handleAddToCart}
            className="w-full h-12"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding to Bag...
              </span>
            ) : productDetail && !selectedVariant?.isAvailable ? (
              'Option Sold Out'
            ) : (
              'Add to Bag'
            )}
          </Button>
        </div>
      </ModalSheetContent>
    </ModalSheet>
  );
}
