'use client';
import { CreditCard, Loader2, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import React, { useEffect, useState } from 'react';

import { Money } from '@hh/domain';

import type { Order, OrderItem } from '@hh/db';

type OrderWithItems = Order & { items: OrderItem[] };

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/user/orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setError(data.error || 'Failed to load orders.');
        }
      })
      .catch(() => {
        setError('Network error while fetching order history.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'processing':
        return { bg: '#EFF6FF', color: '#1D4ED8', text: 'Processing' };
      case 'shipped':
        return { bg: '#ECFDF5', color: '#047857', text: 'Shipped & En Route' };
      case 'delivered':
        return { bg: '#F0FDF4', color: '#15803D', text: 'Delivered' };
      case 'cancelled':
        return { bg: '#FEF2F2', color: '#B91C1C', text: 'Cancelled' };
      default:
        return { bg: '#FFFBEB', color: '#B45309', text: 'Pending Payment' };
    }
  };

  const handlePayNow = async (order: OrderWithItems) => {
    setPayingOrderId(order.id);
    setPaymentError(null);

    try {
      const res = await fetch('/api/checkout/payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPaymentError(data.error || 'Failed to initialize payment gateway.');
        setPayingOrderId(null);
        return;
      }

      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: data.keyId,
          amount: data.amountMinor,
          currency: data.currency,
          name: 'H&H',
          description: `Order ${data.orderNumber}`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: data.customerName || '',
            email: data.customerEmail || '',
            contact: data.customerPhone || ''
          },
          theme: { color: '#0A2E24' },
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              const verifyRes = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                window.location.href = `/checkout/success?orderNumber=${order.orderNumber}`;
              } else {
                setPaymentError(verifyData.error || 'Payment verification failed.');
                setPayingOrderId(null);
              }
            } catch {
              setPaymentError('Network error while verifying payment.');
              setPayingOrderId(null);
            }
          },
          modal: {
            ondismiss: function () {
              setPayingOrderId(null);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        if (process.env['NODE_ENV'] !== 'production') {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              razorpayOrderId: data.razorpayOrderId,
              razorpayPaymentId: `mock_pay_${Date.now()}`,
              razorpaySignature: 'mock_payment_signature'
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            window.location.href = `/checkout/success?orderNumber=${order.orderNumber}`;
            return;
          }
        }
        setPaymentError(
          'Payment gateway could not be loaded. Please disable ad-blockers and try again.'
        );
        setPayingOrderId(null);
      }
    } catch {
      setPaymentError('A network error occurred while launching payment.');
      setPayingOrderId(null);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBE7DF',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 4px 12px rgba(10, 46, 36, 0.03)'
      }}
    >
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div
        style={{ borderBottom: '1px solid #F0ECE4', paddingBottom: '16px', marginBottom: '24px' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            color: '#0A2E24',
            margin: '0 0 6px'
          }}
        >
          Order History & Tracking
        </h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#5C6460' }}>
          Review your previous bespoke orders, view line item details, and track live courier
          shipments.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#5C6460' }}>
          Loading your order history...
        </div>
      ) : error ? (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            borderRadius: '8px',
            fontSize: '0.88rem'
          }}
        >
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#F5EFE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#0A2E24'
            }}
          >
            <ShoppingBag size={24} />
          </div>
          <h2 style={{ fontSize: '1.2rem', color: '#0A2E24', margin: '0 0 8px' }}>
            No Orders Placed Yet
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#5C6460', margin: '0 0 20px' }}>
            When you complete an order, its details and live courier tracking will appear here.
          </p>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              backgroundColor: '#0A2E24',
              color: '#FDFBF7',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Explore Collections
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((ord) => {
            const badge = getStatusBadge(ord.status);
            const dateStr = new Date(ord.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={ord.id}
                style={{
                  border: '1px solid #EBE7DF',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF'
                }}
              >
                {/* Header ribbon */}
                <div
                  style={{
                    backgroundColor: '#FBF9F5',
                    padding: '14px 18px',
                    borderBottom: '1px solid #EBE7DF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: '#8C928F', textTransform: 'uppercase' }}
                    >
                      Order Placed
                    </span>
                    <p
                      style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#0A2E24' }}
                    >
                      {dateStr}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: '#8C928F', textTransform: 'uppercase' }}
                    >
                      Order Reference
                    </span>
                    <p
                      style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#0A2E24' }}
                    >
                      {ord.orderNumber}
                    </p>
                  </div>

                  <div>
                    <span
                      style={{ fontSize: '0.75rem', color: '#8C928F', textTransform: 'uppercase' }}
                    >
                      Total Amount
                    </span>
                    <p
                      style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem', color: '#0A2E24' }}
                    >
                      {Money.fromMinor(ord.totalMinor, 'INR').format('en-IN')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: badge.bg,
                        color: badge.color
                      }}
                    >
                      {badge.text}
                    </span>

                    {ord.status === 'pending_payment' ? (
                      <button
                        type="button"
                        onClick={() => handlePayNow(ord)}
                        disabled={payingOrderId === ord.id}
                        aria-label={`Pay Now for Order ${ord.orderNumber}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          backgroundColor: '#0A2E24',
                          color: '#FDFBF7',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: payingOrderId === ord.id ? 'not-allowed' : 'pointer',
                          opacity: payingOrderId === ord.id ? 0.7 : 1
                        }}
                      >
                        {payingOrderId === ord.id ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Opening Gateway...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard size={13} />
                            <span>Pay Now</span>
                          </>
                        )}
                      </button>
                    ) : ord.status !== 'cancelled' ? (
                      <Link
                        href={`/track/${ord.orderNumber}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          backgroundColor: '#0A2E24',
                          color: '#FDFBF7',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <Truck size={13} />
                        <span>Track Shipment</span>
                      </Link>
                    ) : null}
                  </div>
                </div>

                {paymentError && payingOrderId === ord.id && (
                  <div
                    style={{
                      padding: '10px 18px',
                      backgroundColor: '#FEF2F2',
                      borderBottom: '1px solid #FECACA',
                      color: '#991B1B',
                      fontSize: '0.8rem'
                    }}
                  >
                    {paymentError}
                  </div>
                )}

                {/* Items */}
                <div
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '10px',
                        borderBottom: '1px solid #F5EFE6'
                      }}
                    >
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: '#171A19'
                          }}
                        >
                          {item.productNameSnapshot}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#5C6460' }}>
                          Variant: {item.variantNameSnapshot} • SKU: {item.skuSnapshot} • Qty:{' '}
                          {item.quantity}
                        </p>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0A2E24' }}>
                        {Money.fromMinor(item.unitPriceMinor * item.quantity, 'INR').format(
                          'en-IN'
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Destination */}
                  <div style={{ fontSize: '0.8rem', color: '#5C6460', marginTop: '4px' }}>
                    <strong>Delivery Address:</strong> {ord.shippingAddress.line1},{' '}
                    {ord.shippingAddress.city}, {ord.shippingAddress.state} -{' '}
                    {ord.shippingAddress.postalCode}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
