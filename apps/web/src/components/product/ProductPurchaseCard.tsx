'use client';

import { Check, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import React, { useState } from 'react';

import { Money, type PublicVariantItem } from '@hh/domain';

import { useCart } from '../../context/CartContext';
import { WishlistButton } from './WishlistButton';

export function ProductPurchaseCard({
  variants,
  initialVariantId,
  productId
}: {
  variants: PublicVariantItem[];
  initialVariantId?: string | undefined;
  productId?: string | undefined;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialVariantId ?? variants[0]?.id ?? ''
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  if (!selectedVariant) {
    return <div>Product unavailable</div>;
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
    <div
      className="royale-card"
      style={{
        padding: '32px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-subtle)'
      }}
    >
      {/* Price Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--color-primary)'
          }}
        >
          {priceFormatted}
        </span>
        {selectedVariant.compareAtPriceMinor && (
          <span
            style={{
              fontSize: '1.1rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'line-through'
            }}
          >
            {Money.fromMinor(selectedVariant.compareAtPriceMinor, 'INR').format('en-IN')}
          </span>
        )}
      </div>

      {/* Stock Status Urgency */}
      <div style={{ marginBottom: '24px' }}>
        {isAvailable ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0e5a3a',
              fontSize: '0.85rem',
              fontWeight: 500
            }}
          >
            <Sparkles size={16} />
            <span>
              In Stock — <strong>{selectedVariant.availableQuantity} pieces</strong> handcrafted
              &amp; ready to ship
            </span>
          </div>
        ) : (
          <div style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
            Currently Sold Out
          </div>
        )}
      </div>

      {/* Variant Selector (if > 1 variant) */}
      {variants.length > 1 && (
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '8px'
            }}
          >
            Variant
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVariantId(v.id);
                  setQuantity(1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor:
                    selectedVariantId === v.id ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: selectedVariantId === v.id ? 'var(--color-primary)' : '#ffffff',
                  color: selectedVariantId === v.id ? '#ffffff' : 'var(--color-text)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {v.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      {isAvailable && (
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '8px'
            }}
          >
            Quantity
          </label>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '1.1rem',
                cursor: quantity <= 1 ? 'not-allowed' : 'pointer'
              }}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span
              style={{
                padding: '8px 16px',
                fontWeight: 600,
                minWidth: '40px',
                textAlign: 'center'
              }}
            >
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
              disabled={quantity >= maxAllowed}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'transparent',
                fontSize: '1.1rem',
                cursor: quantity >= maxAllowed ? 'not-allowed' : 'pointer'
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isAvailable}
        className="royale-button-primary"
        style={{
          width: '100%',
          padding: '16px 24px',
          fontSize: '1rem',
          backgroundColor: added ? '#0e5a3a' : undefined
        }}
      >
        {added ? (
          <>
            <Check size={18} />
            <span>Added to Bag</span>
          </>
        ) : (
          <>
            <ShoppingBag size={18} />
            <span>{isAvailable ? 'Add to Shopping Bag' : 'Sold Out'}</span>
          </>
        )}
      </button>

      {productId && (
        <div style={{ marginTop: '12px' }}>
          <WishlistButton
            productId={productId}
            variantId={selectedVariantId}
            variant="button"
          />
        </div>
      )}

      {/* Trust Reassurances */}
      <div
        style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={16} style={{ color: 'var(--color-accent)' }} />
          <span>Manual packing &amp; express courier via India Post / DTDC</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--color-accent)' }} />
          <span>Encrypted Razorpay checkout • Zero card detail storage</span>
        </div>
      </div>
    </div>
  );
}
