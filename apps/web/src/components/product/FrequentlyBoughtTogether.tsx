'use client';

import { Loader2, Plus, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

import {
  type CurrencyCode,
  Money,
  type PublicProductDetail,
  type PublicProductListItem
} from '@hh/domain';

export interface FrequentlyBoughtTogetherProps {
  currentProduct: PublicProductDetail;
  suggestedProducts: PublicProductListItem[];
}

interface BundleItem {
  id: string;
  title: string;
  slug: string;
  priceMinor: number;
  imageUrl: string | null;
  variantId: string;
  isMain: boolean;
  selected: boolean;
}

export function FrequentlyBoughtTogether({
  currentProduct,
  suggestedProducts
}: FrequentlyBoughtTogetherProps) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const primaryVariant = currentProduct.variants[0];
  const primaryImage = currentProduct.images[0]?.url ?? null;

  // Build items list
  const initialItems: BundleItem[] = React.useMemo(() => {
    const list: BundleItem[] = [];

    if (primaryVariant) {
      list.push({
        id: currentProduct.id,
        title: currentProduct.title,
        slug: currentProduct.slug,
        priceMinor: primaryVariant.priceMinor,
        imageUrl: primaryImage,
        variantId: primaryVariant.id,
        isMain: true,
        selected: true
      });
    }

    suggestedProducts.slice(0, 2).forEach((prod) => {
      const variantId = prod.firstVariantId;
      if (variantId) {
        list.push({
          id: prod.id,
          title: prod.title,
          slug: prod.slug,
          priceMinor: prod.startingPriceMinor,
          imageUrl: prod.primaryImageUrl,
          variantId,
          isMain: false,
          selected: true
        });
      }
    });

    return list;
  }, [currentProduct, primaryVariant, primaryImage, suggestedProducts]);

  const [items, setItems] = React.useState<BundleItem[]>(initialItems);
  const [isAddingAll, setIsAddingAll] = React.useState(false);

  // Sync initial items when props change
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  if (items.length < 2) {
    return null;
  }

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const selectedItems = items.filter((i) => i.selected);
  const totalMinor = selectedItems.reduce((acc, curr) => acc + curr.priceMinor, 0);
  const currency = (currentProduct.currency as CurrencyCode) || 'INR';
  const formattedTotal = Money.fromMinor(totalMinor, currency).format('en-IN');

  const handleAddAll = async () => {
    if (selectedItems.length === 0 || isAddingAll) return;
    try {
      setIsAddingAll(true);
      await Promise.all(selectedItems.map((item) => addItem(item.variantId, 1)));
      toast({
        message: `Added ${selectedItems.length} curated pieces to your bag`,
        variant: 'success',
        action: {
          label: 'View Bag',
          onClick: openCart
        }
      });
    } catch {
      toast({
        message: 'Could not add all items. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsAddingAll(false);
    }
  };

  return (
    <section className="my-12 rounded-md border border-border bg-card p-6 sm:p-8 shadow-xs">
      <div className="mb-6">
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">
          Curated Pairing
        </span>
        <h3 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
          Frequently Bought Together
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Products Row with '+' separators */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {items.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <div className="flex items-center justify-center text-muted-foreground">
                  <Plus className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  'flex items-center gap-3 rounded-sm border p-2.5 transition-all max-w-[220px]',
                  item.selected
                    ? 'border-input bg-muted/40 shadow-xs'
                    : 'border-border bg-card opacity-60'
                )}
              >
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-col">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItem(item.id)}
                      className="h-3.5 w-3.5 rounded-sm border-input text-primary accent-primary focus:ring-ring cursor-pointer"
                    />
                    <span className="truncate text-xs font-semibold text-foreground">
                      {item.isMain ? 'This Piece' : item.title}
                    </span>
                  </label>
                  <span className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                    {Money.fromMinor(item.priceMinor, currency).format('en-IN')}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Bundle Summary and Checkout CTA */}
        <div className="flex w-full lg:w-auto flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-8">
          <div className="flex flex-col lg:text-right">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Total for {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-foreground">
              {formattedTotal}
            </span>
            <span className="text-[10px] text-muted-foreground">MRP (Inclusive of all taxes)</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={selectedItems.length === 0 || isAddingAll}
            onClick={handleAddAll}
            className="w-full sm:w-auto min-h-[44px] text-xs font-semibold px-6 select-none"
          >
            {isAddingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShoppingBag className="mr-2 h-4 w-4" />
            )}
            <span>Add Selected to Bag</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
