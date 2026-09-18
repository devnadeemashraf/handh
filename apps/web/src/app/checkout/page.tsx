'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { AddressForm, type AddressFormValues } from '@/components/checkout/AddressForm';
import { OrderReviewCard } from '@/components/checkout/OrderReviewCard';
import { ShippingAddressSchema, Money, type CheckoutOrderResult } from '@hh/domain';
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';

export default function CheckoutPage() {
  const { cartSummary, isLoading: isCartLoading, clearCart, refreshCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<CheckoutOrderResult | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [reservationRemainingSecs, setReservationRemainingSecs] = useState<number>(15 * 60);

  // Client-side idempotency key generation (persists per session until success)
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    if (!idempotencyKey && typeof window !== 'undefined') {
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [idempotencyKey]);

  // Form values state
  const [values, setValues] = useState<AddressFormValues>({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    customerNotes: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>({});

  // Countdown timer for 15-minute reservation once order is created
  useEffect(() => {
    if (!orderPlaced) return;

    const expiryTime = new Date(orderPlaced.expiresAt).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setReservationRemainingSecs(diffSecs);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [orderPlaced]);

  const handleFieldChange = (field: keyof AddressFormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderNumber(true);
    setTimeout(() => setCopiedOrderNumber(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    // 1. Validate Shipping Address
    const addressValidation = ShippingAddressSchema.safeParse({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      line1: values.line1,
      line2: values.line2 || undefined,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: 'IN'
    });

    if (!addressValidation.success) {
      const fieldErrors: Partial<Record<keyof AddressFormValues, string>> = {};
      for (const issue of addressValidation.error.issues) {
        const fieldName = issue.path[0] as keyof AddressFormValues;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setSubmitError('Please complete all required shipping fields marked below.');
      return;
    }

    if (!cartSummary || cartSummary.items.length === 0) {
      setSubmitError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!cartSummary.isValidForCheckout) {
      setSubmitError('Some items in your cart are no longer available in the requested quantity.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: cartSummary.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.effectiveQuantity
        })),
        shippingAddress: addressValidation.data,
        customerNotes: values.customerNotes ? values.customerNotes.trim() : undefined,
        idempotencyKey: idempotencyKey || crypto.randomUUID()
      };

      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 409) {
          setSubmitError(
            data.error || 'Inventory was reserved by another shopper. Refreshing cart...'
          );
          await refreshCart();
        } else {
          setSubmitError(
            data.error || 'An unexpected error occurred while placing your order. Please try again.'
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Order created successfully!
      const createdOrder = data.order as CheckoutOrderResult;
      setOrderPlaced(createdOrder);
      clearCart();
    } catch (err) {
      console.error('Checkout submission network error:', err);
      setSubmitError('A network error occurred. Please verify your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Order Placed Screen
  if (orderPlaced) {
    const minutes = Math.floor(reservationRemainingSecs / 60);
    const seconds = reservationRemainingSecs % 60;
    const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main className="royale-container" style={{ flex: 1, padding: '56px 16px 96px' }}>
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '40px 28px',
              textAlign: 'center'
            }}
          >
            {/* Success Icon */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(10, 46, 36, 0.08)',
                color: 'var(--color-primary-emerald)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              Order Initiated
            </span>

            <h1 className="royale-heading" style={{ fontSize: '1.85rem', margin: '0 0 12px' }}>
              Artisanal Reservation Confirmed
            </h1>

            <p
              style={{
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.6,
                marginBottom: '24px'
              }}
            >
              Thank you, <strong>{values.fullName}</strong>. Your pending order has been recorded
              and the handcrafted pieces are locked in inventory.
            </p>

            {/* Order Reference Badge */}
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Order Reference
                </span>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-primary-emerald)',
                    letterSpacing: '0.05em',
                    marginTop: '2px'
                  }}
                >
                  {orderPlaced.orderNumber}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyOrderNumber(orderPlaced.orderNumber)}
                aria-label="Copy order reference"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  fontSize: '0.8rem',
                  color: 'var(--color-text)',
                  cursor: 'pointer'
                }}
              >
                {copiedOrderNumber ? (
                  <>
                    <Check size={14} color="#059669" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* 15-Minute Reservation Lock Box */}
            <div
              style={{
                backgroundColor: reservationRemainingSecs > 0 ? '#FFFBEB' : '#FEF2F2',
                border: `1px solid ${reservationRemainingSecs > 0 ? '#FDE68A' : '#FECACA'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                marginBottom: '28px'
              }}
            >
              <Clock
                size={24}
                color={reservationRemainingSecs > 0 ? '#D97706' : '#DC2626'}
                style={{ flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: reservationRemainingSecs > 0 ? '#92400E' : '#991B1B'
                  }}
                >
                  {reservationRemainingSecs > 0
                    ? `Inventory Held for ${formattedTimer}`
                    : 'Reservation Window Expired'}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: reservationRemainingSecs > 0 ? '#B45309' : '#B91C1C',
                    marginTop: '2px'
                  }}
                >
                  {reservationRemainingSecs > 0
                    ? 'Your items are reserved in stock while payment is pending.'
                    : 'The reservation has timed out and stock has been made available to other shoppers.'}
                </div>
              </div>
            </div>

            {/* Financial Details Table */}
            <div
              style={{
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
                padding: '16px 0',
                marginBottom: '28px',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: 'var(--color-text-muted)'
                }}
              >
                <span>Subtotal</span>
                <span>{Money.fromMinor(orderPlaced.subtotalMinor, 'INR').format()}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: 'var(--color-text-muted)'
                }}
              >
                <span>Standard Delivery</span>
                <span>
                  {orderPlaced.shippingMinor === 0
                    ? 'FREE'
                    : Money.fromMinor(orderPlaced.shippingMinor, 'INR').format()}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  color: 'var(--color-text-primary)',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <span>Total Amount</span>
                <span style={{ color: 'var(--color-primary-emerald)' }}>
                  {Money.fromMinor(orderPlaced.totalMinor, 'INR').format()}
                </span>
              </div>
            </div>

            {/* Delivery Destination Snapshot */}
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em'
                }}
              >
                Shipping Destination
              </span>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  marginTop: '4px',
                  lineHeight: 1.5
                }}
              >
                <div>{values.fullName}</div>
                <div>{values.line1}</div>
                {values.line2 && <div>{values.line2}</div>}
                <div>
                  {values.city}, {values.state} - {values.postalCode}
                </div>
                <div>Phone: +91 {values.phone}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/"
                className="royale-button-primary"
                style={{ width: '100%', padding: '14px', textDecoration: 'none' }}
              >
                Explore More Collections
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Empty Cart Guard
  if (!isCartLoading && (!cartSummary || cartSummary.items.length === 0)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <main className="royale-container" style={{ flex: 1, padding: '56px 16px 96px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '72px 24px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              maxWidth: '520px',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                color: 'var(--color-accent-gold)'
              }}
            >
              <ShoppingBag size={28} />
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.4rem',
                color: 'var(--color-primary-emerald)',
                marginBottom: '8px'
              }}
            >
              Your Bag is Empty
            </h2>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                lineHeight: 1.5
              }}
            >
              You need at least one artisanal piece in your bag to initiate checkout.
            </p>
            <Link
              href="/"
              className="royale-button-primary"
              style={{ padding: '12px 28px', textDecoration: 'none' }}
            >
              Browse Catalog
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // 3. Active Checkout Form Screen
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="royale-container" style={{ flex: 1, padding: '40px 16px 96px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/cart"
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
            <span>Return to Collection Bag</span>
          </Link>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <span className="royale-eyebrow">Direct Dispatch</span>
          <h1 className="royale-heading" style={{ fontSize: '2rem', margin: '4px 0 0' }}>
            Checkout & Shipping
          </h1>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#B91C1C',
              fontSize: '0.9rem'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'flex-start'
          }}
        >
          {/* Left: Address & Customer Details */}
          <div>
            <AddressForm
              values={values}
              errors={errors}
              onChange={handleFieldChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Right: Review & Financial Summary Card */}
          <div>
            {cartSummary && (
              <OrderReviewCard
                cartSummary={cartSummary}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
