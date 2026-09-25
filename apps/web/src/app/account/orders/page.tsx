'use client';
import { CreditCard, Loader2, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptic';

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
        return {
          className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
          text: 'Processing'
        };
      case 'shipped':
        return {
          className:
            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          text: 'Shipped & En Route'
        };
      case 'delivered':
        return {
          className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30',
          text: 'Delivered'
        };
      case 'cancelled':
        return {
          className: 'bg-destructive/10 text-destructive border-destructive/30',
          text: 'Cancelled'
        };
      default:
        return {
          className: 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30',
          text: 'Pending Payment'
        };
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
            name: order.customerName || '',
            email: order.customerEmail || '',
            contact: order.customerPhone || ''
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
                const tokenQuery = verifyData.receiptToken
                  ? `&token=${encodeURIComponent(verifyData.receiptToken)}`
                  : '';
                window.location.href = `/checkout/success?orderNumber=${order.orderNumber}${tokenQuery}`;
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
            const tokenQuery = verifyData.receiptToken
              ? `&token=${encodeURIComponent(verifyData.receiptToken)}`
              : '';
            window.location.href = `/checkout/success?orderNumber=${order.orderNumber}${tokenQuery}`;
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
    <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="border-b border-border/60 pb-4 mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1.5">
          Order History & Tracking
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Review your previous bespoke orders, view line item details, and track live courier
          shipments.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading your order history...
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm font-medium">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-primary">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground mb-2">
            No Orders Placed Yet
          </h2>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
            When you complete an order, its details and live courier tracking will appear here.
          </p>
          <Button
            asChild
            onClick={() => triggerHaptic('selection')}
            className="px-6 h-10 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
          >
            <Link href="/">Explore Collections</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
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
                className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs"
              >
                {/* Header ribbon */}
                <div className="bg-muted/30 px-4 sm:px-5 py-3.5 border-b border-border/60 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Order Placed
                    </span>
                    <p className="font-bold text-sm text-foreground">{dateStr}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Order Reference
                    </span>
                    <p className="font-bold text-sm text-foreground">{ord.orderNumber}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Total Amount
                    </span>
                    <p className="font-bold text-sm text-foreground">
                      {Money.fromMinor(ord.totalMinor, 'INR').format('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className={badge.className}>
                      {badge.text}
                    </Badge>

                    {ord.status === 'pending_payment' ? (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          triggerHaptic('medium');
                          handlePayNow(ord);
                        }}
                        disabled={payingOrderId === ord.id}
                        aria-label={`Pay Now for Order ${ord.orderNumber}`}
                        className="gap-1.5 h-8 text-xs font-medium active:scale-[0.96] transition-transform duration-150"
                      >
                        {payingOrderId === ord.id ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Opening Gateway...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Pay Now</span>
                          </>
                        )}
                      </Button>
                    ) : ord.status !== 'cancelled' ? (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        onClick={() => triggerHaptic('selection')}
                        className="gap-1.5 h-8 text-xs font-medium active:scale-[0.96] transition-transform duration-150"
                      >
                        <Link href={`/track/${ord.orderNumber}`}>
                          <Truck className="h-3.5 w-3.5" />
                          <span>Track Shipment</span>
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                {paymentError && payingOrderId === ord.id && (
                  <div className="px-5 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs font-medium">
                    {paymentError}
                  </div>
                )}

                {/* Items */}
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  {ord.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between pb-2.5 border-b border-border/40 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {item.productNameSnapshot}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Variant: {item.variantNameSnapshot} • SKU: {item.skuSnapshot} • Qty:{' '}
                          {item.quantity}
                        </p>
                      </div>

                      <div className="font-semibold text-sm text-foreground">
                        {Money.fromMinor(item.unitPriceMinor * item.quantity, 'INR').format(
                          'en-IN'
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Destination */}
                  <div className="text-xs text-muted-foreground mt-1">
                    <strong className="text-foreground">Delivery Address:</strong>{' '}
                    {ord.shippingAddress.line1}, {ord.shippingAddress.city},{' '}
                    {ord.shippingAddress.state} - {ord.shippingAddress.postalCode}
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
