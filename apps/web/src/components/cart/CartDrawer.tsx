'use client';

import { ArrowRight, Clock, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';

import { Money, type ServiceControlConfig } from '@hh/domain';

import { CartItemRow } from './CartItemRow';

export function CartDrawer() {
  const { isOpen, closeCart, cartSummary, totalItemCount, updateQuantity, removeItem, isLoading } =
    useCart();

  const drawerRef = useRef<HTMLDivElement>(null);
  const [serviceControl, setServiceControl] = useState<ServiceControlConfig | null>(null);

  // Check live store operating status and service circuit breaker
  useEffect(() => {
    if (isOpen) {
      fetch('/api/service-status')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.serviceControl) {
            setServiceControl(data.serviceControl);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Prevent background scroll when cart drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  const subtotalFormatted = cartSummary
    ? Money.fromMinor(cartSummary.subtotalMinor, 'INR').format()
    : '₹0';

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

  const isCheckoutReady = (cartSummary?.isValidForCheckout ?? false) && !isServicePaused;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(10, 46, 36, 0.45)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease-out'
        }}
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          backgroundColor: 'var(--color-bg)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} color="var(--color-primary)" />
            <h2
              id="cart-drawer-title"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--color-primary-emerald)',
                margin: 0
              }}
            >
              Collection Bag
            </h2>
            {totalItemCount > 0 && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-accent-gold-light)',
                  color: 'var(--color-primary-emerald)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}
              >
                {totalItemCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '50%'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 24px'
          }}
        >
          {cartSummary && cartSummary.items.length > 0 ? (
            <div>
              {cartSummary.items.map((item) => (
                <CartItemRow
                  key={item.variantId}
                  item={item}
                  onUpdateQuantity={(newQty) => updateQuantity(item.variantId, newQty)}
                  onRemove={() => removeItem(item.variantId)}
                  disabled={isLoading}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: 'var(--color-accent-gold)'
                }}
              >
                <ShoppingBag size={28} />
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.15rem',
                  color: 'var(--color-primary-emerald)',
                  marginBottom: '8px'
                }}
              >
                Your Bag is Empty
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                  maxWidth: '280px',
                  margin: '0 0 24px'
                }}
              >
                Discover our signature modest wear accessories crafted in limited batches.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="royale-button-primary"
                style={{ fontSize: '0.875rem', padding: '10px 24px' }}
              >
                Explore Collection
              </button>
            </div>
          )}
        </div>

        {/* Drawer Sticky Footer */}
        {cartSummary && cartSummary.items.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)'
            }}
          >
            {/* Subtotal */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}
            >
              <span style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                Subtotal
              </span>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-primary-emerald)',
                  fontFamily: 'var(--font-serif)'
                }}
              >
                {subtotalFormatted}
              </span>
            </div>

            <p
              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0 0 16px' }}
            >
              Applicable shipping and taxes are computed at checkout.
            </p>

            {/* Customer Reassurance Maintenance Banner */}
            {isServicePaused && serviceControl && (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#B45309',
                    fontWeight: 700,
                    fontSize: '0.8125rem'
                  }}
                >
                  <Clock size={15} />
                  <span>{serviceControl.headline}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#78350F', lineHeight: 1.4 }}>
                  {serviceControl.maintenanceNotice}
                </p>
              </div>
            )}

            {/* Checkout Action Button */}
            <Link
              href="/checkout"
              onClick={(e) => {
                if (!isCheckoutReady) {
                  e.preventDefault();
                } else {
                  closeCart();
                }
              }}
              className={`royale-button-primary ${!isCheckoutReady ? 'disabled' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                textDecoration: 'none',
                pointerEvents: isCheckoutReady ? 'auto' : 'none',
                opacity: isCheckoutReady ? 1 : 0.6
              }}
            >
              <span>{isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}</span>
              <ArrowRight size={16} />
            </Link>

            {/* View Full Cart Route */}
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                href="/cart"
                onClick={closeCart}
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'underline'
                }}
              >
                View full bag details
              </Link>
            </div>

            {/* Trust badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '16px',
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)'
              }}
            >
              <ShieldCheck size={14} color="var(--color-primary)" />
              <span>Safe & Secure Direct Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
