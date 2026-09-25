'use client';

import { ArrowRight, Bell, Heart, Package, ShoppingBag, Sparkles, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { QuickAddModal } from '@/components/catalog/QuickAddModal';
import { NotifyMeForm } from '@/components/product/NotifyMeForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { triggerHaptic } from '@/lib/haptic';

import { Money, type PublicProductListItem, type WishlistItemWithDetails } from '@hh/domain';

export default function AccountWishlistPage() {
  const [items, setItems] = useState<WishlistItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  // QuickAddModal state
  const [quickAddProduct, setQuickAddProduct] = useState<PublicProductListItem | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Notify Me modal state
  const [notifyItem, setNotifyItem] = useState<WishlistItemWithDetails | null>(null);

  const { addItem, openCart } = useCart();
  const { addToast } = useToast();

  const loadWishlist = async () => {
    try {
      const res = await fetch('/api/user/wishlist');
      const data = await res.json();
      if (data.success && Array.isArray(data.wishlist)) {
        setItems(data.wishlist);
      }
    } catch {
      setError('Failed to load your wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (item: WishlistItemWithDetails) => {
    triggerHaptic('medium');
    const removedItem = item;

    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.productId !== item.productId));

    try {
      await fetch(`/api/user/wishlist/${item.productId}`, {
        method: 'DELETE'
      });

      // 4-second undo toast (Spec 11 UX Catalog: "Removed from your wishlist" + "Undo" action)
      addToast({
        title: 'Removed from wishlist',
        description: `${item.product?.title || 'Piece'} removed from your wishlist.`,
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await fetch('/api/user/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  productId: removedItem.productId,
                  variantId: removedItem.variantId
                })
              });
              triggerHaptic('success');
              setItems((prev) => [removedItem, ...prev]);
            } catch {
              // Ignore
            }
          }
        }
      });
    } catch {
      // Revert if delete failed
      setItems((prev) => [removedItem, ...prev]);
    }
  };

  const handleAddToBag = async (item: WishlistItemWithDetails) => {
    triggerHaptic('selection');
    const prod = item.product;
    if (!prod) return;

    // If item has variants or multiple options, launch quick add bottom sheet
    if (!item.variantId && prod.defaultVariantId) {
      // Direct add with default variant
      setAddingId(item.productId);
      try {
        await addItem(prod.defaultVariantId, 1);
        triggerHaptic('success');
        addToast({
          title: 'Added to your bag',
          description: `${prod.title} added to your bag.`
        });
        openCart();
      } finally {
        setAddingId(null);
      }
    } else if (item.variantId) {
      // Direct add specific variant
      setAddingId(item.productId);
      try {
        await addItem(item.variantId, 1);
        triggerHaptic('success');
        addToast({
          title: 'Added to your bag',
          description: `${prod.title} added to your bag.`
        });
        openCart();
      } finally {
        setAddingId(null);
      }
    } else {
      // Launch QuickAdd modal
      const listItem: PublicProductListItem = {
        id: prod.id,
        title: prod.title,
        slug: prod.slug,
        startingPriceMinor: prod.priceMinor,
        compareAtPriceMinor: prod.compareAtPriceMinor || null,
        currency: prod.currency,
        primaryImageUrl: prod.imageUrl || null,
        categoryName: 'Couture',
        isAvailable: prod.isAvailable
      };
      setQuickAddProduct(listItem);
      setIsQuickAddOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-md border border-border/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="border-b border-border/60 pb-4">
          <div className="h-7 w-48 bg-muted/60 rounded-sm mb-2 animate-pulse" />
          <div className="h-4 w-72 bg-muted/40 rounded-sm animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col gap-3">
              <div className="aspect-[4/5] bg-muted/30 rounded-sm border border-border/60 animate-pulse" />
              <div className="h-4 w-3/4 bg-muted/40 rounded-sm animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/30 rounded-sm animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-md border border-border/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground tracking-tight mb-1">
            Saved Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your curated collection of bespoke modest couture.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-muted-foreground">
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
        </span>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* Empty State (Spec 11 line 23) */}
      {items.length === 0 ? (
        <div className="py-16 px-4 text-center max-w-sm mx-auto">
          <div className="h-12 w-12 rounded-full bg-royal/10 text-royal flex items-center justify-center mx-auto mb-3 border border-royal/20">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-xl font-medium text-foreground mb-1.5">
            Nothing saved yet
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
            Tap the heart on any product to save it for later.
          </p>
          <Button
            asChild
            onClick={() => triggerHaptic('selection')}
            className="px-6 h-10 text-xs font-medium bg-royal hover:bg-royal/90 text-white rounded-sm active:scale-[0.98] transition-transform"
          >
            <Link href="/shop">Explore the Collection</Link>
          </Button>
        </div>
      ) : (
        /* 2-col mobile / 3-4 col desktop Wishlist Grid (Spec 09 §9.2) */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => {
            const prod = item.product;
            const priceFormatted = prod
              ? Money.fromMinor(prod.priceMinor, prod.currency).format('en-IN')
              : null;
            const isSoldOut = prod ? !prod.isAvailable : false;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col bg-card border border-border/80 rounded-sm overflow-hidden shadow-xs hover:border-royal/40 transition-colors"
              >
                {/* 4:5 Aspect Ratio Image Canvas */}
                <div className="relative aspect-[4/5] w-full bg-secondary/30 overflow-hidden">
                  {prod?.imageUrl ? (
                    <Image
                      src={prod.imageUrl}
                      alt={prod.title}
                      fill
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  {/* Sold Out Badge (if out-of-stock) */}
                  {isSoldOut && (
                    <div className="absolute top-2.5 left-2.5">
                      <Badge
                        variant="secondary"
                        className="bg-background/90 backdrop-blur-xs text-foreground font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm shadow-xs"
                      >
                        Sold Out
                      </Badge>
                    </div>
                  )}

                  {/* Filled Heart Icon Button (Always Filled per Spec 09 §9.2) */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    aria-label={`Remove ${prod?.title || 'item'} from wishlist`}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xs shadow-xs flex items-center justify-center text-royal hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-border/40"
                  >
                    <Heart className="w-4 h-4 fill-royal text-royal" />
                  </button>
                </div>

                {/* Card Content & Details */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    H&amp;H Atelier
                  </span>

                  <h3 className="font-serif font-medium text-xs sm:text-sm text-foreground truncate">
                    <Link
                      href={`/products/${prod?.slug || '#'}`}
                      className="hover:text-royal transition-colors"
                    >
                      {prod?.title || 'Artisanal Piece'}
                    </Link>
                  </h3>

                  {/* Price */}
                  <div className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-royal mt-0.5">
                    {priceFormatted}
                  </div>

                  {/* Persistent Action Beneath Price (Spec 09 §9.2) */}
                  <div className="mt-3 pt-2 border-t border-border/40">
                    {isSoldOut ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          triggerHaptic('selection');
                          setNotifyItem(item);
                        }}
                        className="w-full h-8 text-[11px] font-medium border-border text-foreground hover:bg-secondary/60 rounded-sm gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5 text-royal" />
                        <span>Notify Me</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAddToBag(item)}
                        disabled={addingId === item.productId}
                        className="w-full h-8 text-[11px] font-medium bg-royal hover:bg-royal/90 text-white rounded-sm gap-1.5 active:scale-[0.98] transition-transform"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{addingId === item.productId ? 'Adding...' : 'Add to Bag'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* "You Might Also Like" Recommendation Carousel (Spec 09 §9.2) */}
      <div className="border-t border-border/60 pt-8 mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-royal" />
            <h2 className="font-serif text-lg font-medium text-foreground tracking-tight">
              You Might Also Like
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-xs font-medium text-royal hover:text-royal/80 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Curated modest signatures and seasonal silks tailored to your style.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/30 rounded-sm border border-border/60 text-center flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6 text-royal opacity-60" />
            <span className="text-xs font-semibold text-foreground">Artisanal Abayas</span>
            <Link
              href="/shop?category=abayas"
              className="text-[11px] text-royal underline underline-offset-2"
            >
              Explore Collection
            </Link>
          </div>

          <div className="p-4 bg-secondary/30 rounded-sm border border-border/60 text-center flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6 text-royal opacity-60" />
            <span className="text-xs font-semibold text-foreground">Pure Silk Hijabs</span>
            <Link
              href="/shop?category=hijabs"
              className="text-[11px] text-royal underline underline-offset-2"
            >
              Explore Collection
            </Link>
          </div>

          <div className="p-4 bg-secondary/30 rounded-sm border border-border/60 text-center flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6 text-royal opacity-60" />
            <span className="text-xs font-semibold text-foreground">Signature Kaftans</span>
            <Link
              href="/shop?category=kaftans"
              className="text-[11px] text-royal underline underline-offset-2"
            >
              Explore Collection
            </Link>
          </div>

          <div className="p-4 bg-secondary/30 rounded-sm border border-border/60 text-center flex flex-col items-center justify-center gap-2">
            <Package className="w-6 h-6 text-royal opacity-60" />
            <span className="text-xs font-semibold text-foreground">Handcrafted Pins</span>
            <Link
              href="/shop?category=accessories"
              className="text-[11px] text-royal underline underline-offset-2"
            >
              Explore Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        product={quickAddProduct}
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddProduct(null);
        }}
      />

      {/* Notify Me Modal */}
      {notifyItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-md border border-border/80 overflow-hidden shadow-xl p-5 relative">
            <button
              type="button"
              onClick={() => setNotifyItem(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-sm cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-serif text-lg font-medium text-foreground mb-1">
              Restock Notification
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {notifyItem.product?.title} is currently handcrafted in limited atelier batches.
            </p>
            <NotifyMeForm
              productId={notifyItem.productId}
              {...(notifyItem.product?.title ? { variantTitle: notifyItem.product.title } : {})}
            />
          </div>
        </div>
      )}
    </div>
  );
}
