'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { Money, type ServiceControlConfig } from '@hh/domain';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Sparkles,
  Clock
} from 'lucide-react';

export default function CartPage() {
  const { cartSummary, updateQuantity, removeItem, isLoading, totalItemCount } = useCart();
  const [serviceControl, setServiceControl] = useState<ServiceControlConfig | null>(null);

  useEffect(() => {
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.serviceControl) {
          setServiceControl(data.serviceControl);
        }
      })
      .catch(() => {});
  }, []);

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="royale-container" style={{ flex: 1, padding: '48px 16px 96px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              color: 'var(--color-primary-emerald)',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '32px' }}>
          <h1 className="royale-heading" style={{ fontSize: '2rem', margin: 0 }}>
            Your Collection Bag
          </h1>
          {totalItemCount > 0 && (
            <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
              ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>

        {cartSummary && cartSummary.items.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '48px',
              alignItems: 'flex-start'
            }}
          >
            {/* Left: Cart Items List */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '24px'
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '12px',
                  marginBottom: '8px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Handcrafted Pieces
                </span>
              </div>

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

            {/* Right: Authoritative Order Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '32px 24px',
                position: 'sticky',
                top: '96px'
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.35rem',
                  color: 'var(--color-primary-emerald)',
                  margin: '0 0 20px',
                  borderBottom: '1px solid var(--color-border)',
                  paddingBottom: '12px'
                }}
              >
                Order Summary
              </h2>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {subtotalFormatted}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  fontSize: '0.95rem'
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>Courier Delivery</span>
                <span style={{ color: 'var(--color-accent-gold)', fontWeight: 500 }}>
                  Calculated at checkout
                </span>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '24px'
                }}
              >
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)'
                  }}
                >
                  Estimated Total
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--color-primary-emerald)'
                  }}
                >
                  {subtotalFormatted}
                </span>
              </div>

              {/* Customer Reassurance Maintenance Banner */}
              {isServicePaused && serviceControl && (
                <div
                  style={{
                    padding: '14px 16px',
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
                      fontSize: '0.875rem'
                    }}
                  >
                    <Clock size={16} />
                    <span>{serviceControl.headline}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#78350F', lineHeight: 1.4 }}>
                    {serviceControl.maintenanceNotice}
                  </p>
                </div>
              )}

              {/* Checkout CTA */}
              <Link
                href="/checkout"
                onClick={(e) => {
                  if (!isCheckoutReady) {
                    e.preventDefault();
                  }
                }}
                className={`royale-button-primary ${!isCheckoutReady ? 'disabled' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  pointerEvents: isCheckoutReady ? 'auto' : 'none',
                  opacity: isCheckoutReady ? 1 : 0.6
                }}
              >
                <span>
                  {isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}
                </span>
                <ArrowRight size={18} />
              </Link>

              {!isCheckoutReady && !isServicePaused && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: '#DC2626',
                    marginTop: '10px',
                    textAlign: 'center'
                  }}
                >
                  Please resolve stock warnings above before proceeding.
                </p>
              )}

              {/* Trust Guarantees */}
              <div
                style={{
                  marginTop: '32px',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <Sparkles size={16} color="var(--color-accent-gold)" />
                  <span>Limited Batch Quality Guarantee</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <Truck size={16} color="var(--color-primary)" />
                  <span>Direct Courier Dispatch across India</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)'
                  }}
                >
                  <ShieldCheck size={16} color="var(--color-primary)" />
                  <span>Secure Razorpay Encrypted Checkout</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '96px 24px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              maxWidth: '540px',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: 'var(--color-accent-gold)'
              }}
            >
              <ShoppingBag size={32} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                color: 'var(--color-primary-emerald)',
                marginBottom: '10px'
              }}
            >
              Your Collection Bag is Empty
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                marginBottom: '32px',
                lineHeight: 1.6
              }}
            >
              Explore our artisanal handcrafted nose pieces and modest wear essentials.
            </p>
            <Link
              href="/"
              className="royale-button-primary"
              style={{ padding: '14px 32px', textDecoration: 'none' }}
            >
              Explore Collection
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
