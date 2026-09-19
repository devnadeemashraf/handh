'use client';

import { Check, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
          <div
            style={{
              height: '28px',
              width: '180px',
              backgroundColor: '#eee9e0',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          />
          <div
            style={{
              height: '16px',
              width: '280px',
              backgroundColor: '#f5f0e8',
              borderRadius: '4px'
            }}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}
        >
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                height: '380px',
                backgroundColor: '#f9f6f0',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '20px',
          marginBottom: '32px'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: '0 0 4px 0'
            }}
          >
            Saved Creations
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Your curated collection of bespoke modest couture.
          </p>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
        </span>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #F87171',
            borderRadius: 'var(--radius-sm, 4px)',
            color: '#991B1B',
            fontSize: '0.85rem',
            marginBottom: '24px'
          }}
        >
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div
          style={{
            padding: '64px 24px',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md, 8px)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(197, 168, 128, 0.12)',
              color: 'var(--color-accent)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <Heart size={26} />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: '0 0 8px 0'
            }}
          >
            Your Wishlist is Empty
          </h2>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)',
              maxWidth: '380px',
              margin: '0 auto 24px',
              lineHeight: 1.6
            }}
          >
            Explore our artisanal abayas and modest essentials. Save pieces as you browse to review
            or order anytime.
          </p>
          <Link
            href="/#catalog"
            className="royale-button-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              textDecoration: 'none',
              fontSize: '0.85rem'
            }}
          >
            <span>Explore Collection</span>
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '24px'
          }}
        >
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
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md, 8px)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Image Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '3 / 4',
                    backgroundColor: '#f4f1ea'
                  }}
                >
                  {prod?.imageUrl ? (
                    <Image
                      src={prod.imageUrl}
                      alt={prod.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.85rem'
                      }}
                    >
                      H&amp;H Signature
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    disabled={removingId === item.productId}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#991B1B',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                      transition: 'transform 0.2s ease'
                    }}
                    title="Remove from saved"
                    aria-label="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1rem',
                        fontWeight: 500,
                        color: 'var(--color-text)',
                        margin: '0 0 6px 0'
                      }}
                    >
                      {prod ? (
                        <Link
                          href={`/products/${prod.slug}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {prod.title}
                        </Link>
                      ) : (
                        <span>Product #{item.productId.slice(0, 8)}</span>
                      )}
                    </h2>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                        marginBottom: '16px'
                      }}
                    >
                      {priceFormatted && (
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            fontSize: '0.95rem'
                          }}
                        >
                          {priceFormatted}
                        </span>
                      )}
                      {comparePriceFormatted && (
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            textDecoration: 'line-through'
                          }}
                        >
                          {comparePriceFormatted}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Move to Bag Action */}
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(item)}
                    disabled={
                      !prod?.isAvailable ||
                      addingId === item.productId ||
                      addedId === item.productId
                    }
                    className="royale-button-primary"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: addedId === item.productId ? '#0e5a3a' : undefined
                    }}
                  >
                    {addedId === item.productId ? (
                      <>
                        <Check size={16} />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>{prod?.isAvailable ? 'Add to Bag' : 'Sold Out'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
