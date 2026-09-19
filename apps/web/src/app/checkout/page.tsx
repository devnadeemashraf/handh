'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { AddressForm, type AddressFormValues } from '@/components/checkout/AddressForm';
import { OrderReviewCard } from '@/components/checkout/OrderReviewCard';
import {
  ShippingAddressSchema,
  Money,
  type CheckoutOrderResult,
  type ServiceControlConfig
} from '@hh/domain';
import {
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck
} from 'lucide-react';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartSummary, isLoading: isCartLoading, clearCart, refreshCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState<CheckoutOrderResult | null>(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [reservationRemainingSecs, setReservationRemainingSecs] = useState<number>(15 * 60);
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

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

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

  // Verify payment on server
  const verifyPayment = async (params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderNumber: string;
  }) => {
    setIsProcessingPayment(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: params.orderId,
          razorpayOrderId: params.razorpayOrderId,
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Payment confirmation failed. Please contact support.');
        setIsProcessingPayment(false);
        return;
      }

      // Route directly to the receipt page
      router.push(`/checkout/success?orderNumber=${params.orderNumber}`);
    } catch (err) {
      console.error('Payment verification error:', err);
      setSubmitError('A network error occurred while confirming payment.');
      setIsProcessingPayment(false);
    }
  };

  // Launch Razorpay gateway modal
  const launchPaymentGateway = async (createdOrder: CheckoutOrderResult) => {
    if (serviceControl && !serviceControl.paymentsEnabled) {
      setSubmitError(
        serviceControl.maintenanceNotice ||
          'Payment processing is temporarily paused for system maintenance. Your order reservation is safe—please check back shortly.'
      );
      return;
    }

    setIsProcessingPayment(true);
    setSubmitError(null);

    try {
      const initRes = await fetch('/api/checkout/payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrder.orderId })
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        setSubmitError(initData.error || 'Failed to initialize payment gateway.');
        setIsProcessingPayment(false);
        return;
      }

      // Check if Razorpay Checkout SDK is available
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: initData.keyId,
          amount: initData.amountMinor,
          currency: initData.currency,
          name: 'H&H',
          description: `Order ${initData.orderNumber}`,
          order_id: initData.razorpayOrderId,
          prefill: {
            name: values.fullName,
            email: values.email,
            contact: values.phone
          },
          theme: {
            color: '#0A2E24'
          },
          handler: async function (response: RazorpayResponse) {
            await verifyPayment({
              orderId: createdOrder.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderNumber: createdOrder.orderNumber
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for offline/mock development mode
        await verifyPayment({
          orderId: createdOrder.orderId,
          razorpayOrderId: initData.razorpayOrderId,
          razorpayPaymentId: `mock_pay_${Date.now()}`,
          razorpaySignature: 'mock_payment_signature',
          orderNumber: createdOrder.orderNumber
        });
      }
    } catch (err) {
      console.error('Payment launch error:', err);
      setSubmitError('Unable to launch payment gateway. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (isServicePaused) {
      setSubmitError(
        serviceControl?.maintenanceNotice ||
          'Checkout and payment processing is temporarily undergoing maintenance. Please keep items in your bag and check back shortly!'
      );
      return;
    }

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

      // Order created & stock locked!
      const createdOrder = data.order as CheckoutOrderResult;
      setOrderPlaced(createdOrder);
      clearCart();
      setIsSubmitting(false);

      // Immediately launch payment gateway
      await launchPaymentGateway(createdOrder);
    } catch (err) {
      console.error('Checkout submission network error:', err);
      setSubmitError('A network error occurred. Please verify your connection and try again.');
      setIsSubmitting(false);
    }
  };

  // 1. Order Placed Screen (Awaiting Payment or Retry)
  if (orderPlaced) {
    const minutes = Math.floor(reservationRemainingSecs / 60);
    const seconds = reservationRemainingSecs % 60;
    const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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
            {/* Header Icon */}
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
              Order Reserved
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
              Thank you, <strong>{values.fullName}</strong>. Your pieces are held in inventory.
              Please complete your payment below to confirm dispatch.
            </p>

            {/* Error message if payment failed */}
            {submitError && (
              <div
                style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#B91C1C',
                  fontSize: '0.85rem',
                  textAlign: 'left'
                }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

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
                    : 'The reservation window has timed out. Please refresh to place a new order.'}
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
                <span>Total Amount Due</span>
                <span style={{ color: 'var(--color-primary-emerald)' }}>
                  {Money.fromMinor(orderPlaced.totalMinor, 'INR').format()}
                </span>
              </div>
            </div>

            {/* Payment Trigger CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                type="button"
                onClick={() => launchPaymentGateway(orderPlaced)}
                disabled={
                  isProcessingPayment ||
                  reservationRemainingSecs <= 0 ||
                  (serviceControl !== null && !serviceControl.paymentsEnabled)
                }
                className="royale-button-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Connecting with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay {Money.fromMinor(orderPlaced.totalMinor, 'INR').format()} Now</span>
                  </>
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)'
                }}
              >
                <ShieldCheck size={14} color="var(--color-primary-emerald)" />
                <span>UPI, Credit/Debit Cards, NetBanking, and Wallets accepted</span>
              </div>
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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
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

        {/* Service Control Reassurance Banner */}
        {isServicePaused && (
          <div
            style={{
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: '#92400E'
            }}
          >
            <AlertTriangle
              size={20}
              style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                Checkout Temporarily Paused
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                {serviceControl?.maintenanceNotice ||
                  'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'}
              </div>
            </div>
          </div>
        )}

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
              disabled={isSubmitting || isProcessingPayment || isServicePaused}
            />
          </div>

          {/* Right: Review & Financial Summary Card */}
          <div>
            {cartSummary && (
              <OrderReviewCard
                cartSummary={cartSummary}
                isSubmitting={isSubmitting || isProcessingPayment}
                onSubmit={handleSubmit}
                disabled={isServicePaused}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
