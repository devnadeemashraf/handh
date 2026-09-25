'use client';

import { Check, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptic';

import { Money, type WishlistItemWithDetails } from '@hh/domain';

import { useCart } from '../../../context/CartContext';

export default function AccountWishlistPage() {
  const [items, setItems] = useState<WishlistItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { addItem, openCart } = useCart();

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

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/user/wishlist/${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.productId !== productId));
      }
    } catch {
      // Ignored
    } finally {
      setRemovingId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistItemWithDetails) => {
    const variantId = item.product?.defaultVariantId ?? item.variantId;
    if (!variantId) return;

    setAddingId(item.productId);
    try {
      await addItem(variantId, 1);
      setAddedId(item.productId);
      openCart();
      setTimeout(() => setAddedId(null), 2000);
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="border-b border-border/60 pb-5">
          <div className="h-7 w-44 bg-muted/60 rounded-md mb-2 animate-pulse" />
          <div className="h-4 w-72 bg-muted/40 rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-96 bg-muted/30 rounded-2xl border border-border/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
      <div className="flex justify-between items-baseline border-b border-border/60 pb-5 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-foreground mb-1">
            Saved Creations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground m-0">
            Your curated collection of bespoke modest couture.
          </p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
        </span>
      </div>

      {error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium mb-6">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-16 px-6 text-center bg-card rounded-2xl border border-border/60 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-accent">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            Your Wishlist is Empty
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Explore our artisanal abayas and modest essentials. Save pieces as you browse to review
            or order anytime.
          </p>
          <Button
            asChild
            onClick={() => triggerHaptic('selection')}
            className="px-6 h-10 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
          >
            <Link href="/#catalog">Explore Collection</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => {
            const prod = item.product;
            const priceFormatted = prod
              ? Money.fromMinor(prod.priceMinor, prod.currency).format('en-IN')
              : null;
            const comparePriceFormatted =
              prod?.compareAtPriceMinor && prod.compareAtPriceMinor > prod.priceMinor
                ? Money.fromMinor(prod.compareAtPriceMinor, prod.currency).format('en-IN')
                : null;

            return (
              <div
                key={item.id}
                className="bg-card border border-border/80 rounded-2xl overflow-hidden flex flex-col relative shadow-xs group"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-3/4 bg-muted/30 overflow-hidden">
                  {prod?.imageUrl ? (
                    <Image
                      src={prod.imageUrl}
                      alt={prod.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-serif">
                      H&amp;H Signature
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('heavy');
                      handleRemove(item.productId);
                    }}
                    disabled={removingId === item.productId}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur-xs border border-border/60 flex items-center justify-center text-destructive/80 hover:text-destructive shadow-sm cursor-pointer active:scale-90 transition-transform duration-150"
                    title="Remove from saved"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-sm font-semibold text-foreground mb-1 line-clamp-1">
                      {prod ? (
                        <Link
                          href={`/products/${prod.slug}`}
                          onClick={() => triggerHaptic('selection')}
                          className="hover:underline"
                        >
                          {prod.title}
                        </Link>
                      ) : (
                        <span>Product #{item.productId.slice(0, 8)}</span>
                      )}
                    </h2>

                    <div className="flex items-baseline gap-2 mb-2">
                      {priceFormatted && (
                        <span className="font-semibold text-foreground text-sm">
                          {priceFormatted}
                        </span>
                      )}
                      {comparePriceFormatted && (
                        <span className="text-xs text-muted-foreground line-through">
                          {comparePriceFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Move to Bag Action */}
                  <Button
                    type="button"
                    onClick={() => {
                      triggerHaptic('medium');
                      handleMoveToCart(item);
                    }}
                    disabled={
                      !prod?.isAvailable ||
                      addingId === item.productId ||
                      addedId === item.productId
                    }
                    className="w-full h-9 text-xs font-medium gap-1.5 active:scale-[0.96] transition-transform duration-150"
                  >
                    {addedId === item.productId ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="h-4 w-4" />
                        <span>{prod?.isAvailable ? 'Add to Bag' : 'Sold Out'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
