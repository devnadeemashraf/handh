'use client';

import { AlertCircle, Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { type CartItemDetail, Money } from '@hh/domain';

interface CartItemRowProps {
  item: CartItemDetail;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  disabled = false
}: CartItemRowProps) {
  const formattedUnitPrice = Money.fromMinor(item.priceMinor, 'INR').format();
  const formattedLineTotal = Money.fromMinor(item.lineTotalMinor, 'INR').format();

  const isOutOfStock = item.statusNotice === 'out_of_stock';
  const isQuantityReduced = item.statusNotice === 'quantity_reduced';
  const isUnavailable = item.statusNotice === 'unavailable';

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-border)',
        alignItems: 'flex-start'
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          position: 'relative',
          width: '72px',
          height: '72px',
          flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          backgroundColor: '#F5EFE6',
          border: '1px solid var(--color-border)'
        }}
      >
        {item.primaryImageUrl ? (
          <Image
            src={item.primaryImageUrl}
            alt={item.productTitle}
            fill
            sizes="72px"
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
              color: 'var(--color-accent-gold)',
              fontSize: '11px',
              fontWeight: 500,
              textAlign: 'center',
              padding: '4px'
            }}
          >
            H&H
          </div>
        )}
      </div>

      {/* Item Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {item.productSlug ? (
              <Link
                href={`/products/${item.productSlug}`}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-primary-emerald)',
                  textDecoration: 'none',
                  display: 'block',
                  lineHeight: 1.3
                }}
              >
                {item.productTitle}
              </Link>
            ) : (
              <span
                style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
              >
                {item.productTitle}
              </span>
            )}
            {item.variantTitle &&
              item.variantTitle !== 'Default' &&
              item.variantTitle !== 'Default Variant' && (
                <div
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}
                >
                  {item.variantTitle}
                </div>
              )}
          </div>

          <span
            style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}
          >
            {formattedLineTotal}
          </span>
        </div>

        {/* Unit price display if qty > 1 */}
        {item.effectiveQuantity > 1 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {formattedUnitPrice} each
          </div>
        )}

        {/* Warning / Error Notices */}
        {isOutOfStock && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#DC2626',
              marginTop: '6px',
              fontWeight: 500
            }}
          >
            <AlertCircle size={14} />
            Out of stock. Please remove to checkout.
          </div>
        )}

        {isQuantityReduced && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#D97706',
              marginTop: '6px',
              fontWeight: 500
            }}
          >
            <AlertCircle size={14} />
            Only {item.availableQuantity} left in stock (adjusted from {item.requestedQuantity}).
          </div>
        )}

        {isUnavailable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: '#DC2626',
              marginTop: '6px',
              fontWeight: 500
            }}
          >
            <AlertCircle size={14} />
            Product is no longer available.
          </div>
        )}

        {/* Stepper & Remove controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '12px'
          }}
        >
          {/* Touch-Friendly Stepper (Mobile First: min 44x44px tap targets) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-surface)',
              overflow: 'hidden'
            }}
          >
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity - 1)}
              disabled={disabled || item.requestedQuantity <= 1}
              aria-label="Decrease quantity"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: item.requestedQuantity <= 1 ? 'not-allowed' : 'pointer',
                color:
                  item.requestedQuantity <= 1 ? 'var(--color-border)' : 'var(--color-text-primary)'
              }}
            >
              <Minus size={14} />
            </button>
            <span
              style={{
                minWidth: '32px',
                textAlign: 'center',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              {item.requestedQuantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.requestedQuantity + 1)}
              disabled={disabled || item.requestedQuantity >= Math.min(10, item.availableQuantity)}
              aria-label="Increase quantity"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                backgroundColor: 'transparent',
                cursor:
                  item.requestedQuantity >= Math.min(10, item.availableQuantity)
                    ? 'not-allowed'
                    : 'pointer',
                color:
                  item.requestedQuantity >= Math.min(10, item.availableQuantity)
                    ? 'var(--color-border)'
                    : 'var(--color-text-primary)'
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px',
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
