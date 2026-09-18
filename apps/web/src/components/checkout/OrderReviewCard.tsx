'use client';

import React from 'react';
import Image from 'next/image';
import { Money, calculateCheckoutFinancials, type CartSummary } from '@hh/domain';
import { ShieldCheck, Clock, Truck, Sparkles, Loader2 } from 'lucide-react';

interface OrderReviewCardProps {
  cartSummary: CartSummary;
  isSubmitting: boolean;
  onSubmit: () => void;
  disabled?: boolean;
}

export function OrderReviewCard({
  cartSummary,
  isSubmitting,
  onSubmit,
  disabled = false
}: OrderReviewCardProps) {
  const financials = calculateCheckoutFinancials(cartSummary.subtotalMinor, 'INR');

  const subtotalFormatted = Money.fromMinor(financials.subtotalMinor, 'INR').format();
  const shippingFormatted = financials.isFreeDelivery
    ? 'FREE'
    : Money.fromMinor(financials.shippingMinor, 'INR').format();
  const totalFormatted = Money.fromMinor(financials.totalMinor, 'INR').format();
  const remainingForFreeFormatted = Money.fromMinor(
    financials.remainingForFreeDeliveryMinor,
    'INR'
  ).format();

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: '24px 20px',
        position: 'sticky',
        top: '96px'
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--color-primary-emerald)',
          margin: '0 0 16px',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '12px'
        }}
      >
        Order Summary ({cartSummary.totalQuantity}{' '}
        {cartSummary.totalQuantity === 1 ? 'piece' : 'pieces'})
      </h2>

      {/* Items Preview List */}
      <div
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
          marginBottom: '20px',
          paddingRight: '4px'
        }}
      >
        {cartSummary.items.map((item) => (
          <div
            key={item.variantId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 0',
              borderBottom: '1px solid var(--color-border)'
            }}
          >
            {/* Thumbnail */}
            <div
              style={{
                position: 'relative',
                width: '48px',
                height: '48px',
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
                  sizes="48px"
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
                    fontSize: '10px',
                    fontWeight: 600
                  }}
                >
                  H&H
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {item.productTitle}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  marginTop: '2px'
                }}
              >
                {item.variantTitle &&
                item.variantTitle !== 'Default' &&
                item.variantTitle !== 'Default Variant'
                  ? `${item.variantTitle} · `
                  : ''}
                Qty: {item.effectiveQuantity}
              </div>
            </div>

            {/* Price */}
            <div
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              {Money.fromMinor(item.lineTotalMinor, 'INR').format()}
            </div>
          </div>
        ))}
      </div>

      {/* Free Delivery Incentive Prompt */}
      {!financials.isFreeDelivery && financials.remainingForFreeDeliveryMinor > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-accent-light)',
            border: '1px solid rgba(197, 168, 128, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#7d5926'
          }}
        >
          <Sparkles size={16} style={{ flexShrink: 0 }} />
          <span>
            Add <strong>{remainingForFreeFormatted}</strong> more to your order to unlock{' '}
            <strong>Free Express Delivery</strong>!
          </span>
        </div>
      )}

      {/* Financial Breakdown Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: 'var(--color-text-muted)'
          }}
        >
          <span>Subtotal</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {subtotalFormatted}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            color: 'var(--color-text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={15} />
            <span>Standard Courier Delivery</span>
          </div>
          <span
            style={{
              fontWeight: 600,
              color: financials.isFreeDelivery ? '#059669' : 'var(--color-text-primary)'
            }}
          >
            {shippingFormatted}
          </span>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}
            >
              Total to Pay
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Inclusive of all taxes & delivery
            </div>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 700,
              color: 'var(--color-primary-emerald)'
            }}
          >
            {totalFormatted}
          </span>
        </div>
      </div>

      {/* Inventory Lock Guarantee */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '10px 12px',
          backgroundColor: 'rgba(10, 46, 36, 0.04)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(10, 46, 36, 0.1)',
          marginBottom: '20px',
          fontSize: '0.78rem',
          color: 'var(--color-primary-emerald)',
          lineHeight: 1.4
        }}
      >
        <Clock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>15-Minute Reservation:</strong> Stock is reserved exclusively for you once order
          is initiated, preventing overselling.
        </span>
      </div>

      {/* Primary Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isSubmitting || !cartSummary.isValidForCheckout}
        className="royale-button-primary"
        style={{
          width: '100%',
          minHeight: '52px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: '0 4px 14px rgba(10, 46, 36, 0.15)'
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Securing Stock & Placing Order...</span>
          </>
        ) : (
          <span>Place Order & Proceed to Pay</span>
        )}
      </button>

      {/* Security & Reassurance */}
      <div
        style={{
          marginTop: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)'
        }}
      >
        <ShieldCheck size={14} color="var(--color-primary-emerald)" />
        <span>256-Bit Encrypted Secure Checkout</span>
      </div>
    </div>
  );
}
