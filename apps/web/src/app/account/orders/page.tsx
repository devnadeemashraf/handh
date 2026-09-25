'use client';

import { CreditCard, Loader2, Package, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useCart } from '@/context/CartContext';
import { triggerHaptic } from '@/lib/haptic';

import { DEFAULT_BRAND_IDENTITY, Money } from '@hh/domain';

import type { Order, OrderItem } from '@hh/db';

type OrderWithItems = Order & { items: OrderItem[] };

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const { addItem, openCart } = useCart();
  const { addToast } = useToast();

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
          className: 'bg-primary/10 text-primary border-primary/30 font-medium text-xs rounded-sm',
          text: 'Processing'
        };
      case 'shipped':
        return {
          className:
            'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium text-xs rounded-sm',
          text: 'Shipped & En Route'
        };
      case 'delivered':
        return {
          className:
            'bg-emerald-600/10 text-emerald-800 dark:text-emerald-200 border-emerald-600/30 font-medium text-xs rounded-sm',
          text: 'Delivered'
        };
      case 'cancelled':
        return {
          className:
            'bg-destructive/10 text-destructive border-destructive/30 font-medium text-xs rounded-sm',
          text: 'Cancelled'
        };
      default:
        return {
          className:
            'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30 font-medium text-xs rounded-sm',
          text: 'Pending Payment'
        };
    }
  };

  const handleBuyAgain = async (order: OrderWithItems) => {
    setReorderingId(order.id);
    triggerHaptic('medium');

    try {
      let addedAny = false;
      for (const item of order.items) {
        if (item.variantId) {
          await addItem(item.variantId, item.quantity);
          addedAny = true;
        }
      }

      if (addedAny) {
        triggerHaptic('success');
        addToast({
          title: 'Added to your bag',
          description: `Items from order ${order.orderNumber} added to your bag.`
        });
        openCart();
      }
    } catch {
      addToast({
        title: 'Notice',
        description: 'Could not re-order all items. Some pieces may be out of stock.'
      });
    } finally {
      setReorderingId(null);
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
          name: DEFAULT_BRAND_IDENTITY.name,
          description: `Order ${data.orderNumber}`,
          order_id: data.razorpayOrderId,
          prefill: {
            name: order.customerName || '',
            email: order.customerEmail || '',
            contact: order.customerPhone || ''
          },
          theme: { color: DEFAULT_BRAND_IDENTITY.theme.primaryEmerald },
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
    <div className="bg-card rounded-md border border-border/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="border-b border-border/60 pb-4">
        <h1 className="font-serif text-2xl font-medium text-foreground tracking-tight mb-1">
          Order History &amp; Tracking
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Review your previous orders, track live dispatches, and re-order signature pieces.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
          Loading your order history...
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-sm font-medium">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center max-w-sm mx-auto">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h2 className="font-serif text-xl font-medium text-foreground mb-1.5">No orders yet</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">
            Your past orders will appear here.
          </p>
          <Button
            asChild
            onClick={() => triggerHaptic('selection')}
            className="px-6 h-10 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm active:scale-[0.98] transition-transform"
          >
            <Link href="/shop">Start Shopping</Link>
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

            const maxThumbs = 3;
            const extraCount = ord.items.length > maxThumbs ? ord.items.length - maxThumbs : 0;

            return (
              <div
                key={ord.id}
                className="border border-border/80 rounded-md overflow-hidden bg-card shadow-xs"
              >
                {/* Header ribbon */}
                <div className="bg-secondary/30 px-4 sm:px-5 py-3 border-b border-border/60 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Order Placed
                    </span>
                    <p className="font-medium text-xs sm:text-sm text-foreground">{dateStr}</p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Order Reference
                    </span>
                    <p className="font-mono tabular-nums font-semibold text-xs sm:text-sm text-foreground">
                      {ord.orderNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Total Amount
                    </span>
                    <p className="font-mono tabular-nums font-bold text-xs sm:text-sm text-primary">
                      {Money.fromMinor(ord.totalMinor, 'INR').format('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={badge.className}>
                      {badge.text}
                    </Badge>

                    {/* Pending payment: Pay Now */}
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
                        className="gap-1.5 h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm active:scale-[0.98] transition-transform"
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
                        className="gap-1.5 h-8 text-xs font-medium border-border hover:bg-secondary/60 rounded-sm active:scale-[0.98] transition-transform"
                      >
                        <Link href={`/track/${ord.orderNumber}`}>
                          <Truck className="h-3.5 w-3.5" />
                          <span>Track Shipment</span>
                        </Link>
                      </Button>
                    ) : null}

                    {/* Buy Again Action (Spec 08 §8.3) */}
                    {ord.status !== 'pending_payment' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBuyAgain(ord)}
                        disabled={reorderingId === ord.id}
                        aria-label={`Buy Again from Order ${ord.orderNumber}`}
                        className="gap-1.5 h-8 text-xs font-medium text-foreground hover:bg-secondary/60 rounded-sm"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{reorderingId === ord.id ? 'Adding...' : 'Buy Again'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {paymentError && payingOrderId === ord.id && (
                  <div className="px-5 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs font-medium">
                    {paymentError}
                  </div>
                )}

                {/* Items Row with 4:5 Thumbnails */}
                <div className="p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {ord.items.slice(0, maxThumbs).map((item) => (
                      <div
                        key={item.id}
                        className="w-12 h-15 rounded-sm bg-muted/40 border border-border/60 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden"
                        title={`${item.productNameSnapshot} (${item.variantNameSnapshot})`}
                      >
                        <Package className="w-5 h-5 opacity-40" />
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="w-12 h-15 rounded-sm bg-secondary/50 border border-border/60 flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                        +{extraCount} more
                      </div>
                    )}
                  </div>

                  {/* Item text list */}
                  <div className="divide-y divide-border/40 pt-1">
                    {ord.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-medium text-xs sm:text-sm text-foreground truncate">
                            {item.productNameSnapshot}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.variantNameSnapshot} · Qty: {item.quantity}
                          </p>
                        </div>

                        <div className="font-mono tabular-nums text-xs sm:text-sm font-medium text-foreground shrink-0">
                          {Money.fromMinor(item.unitPriceMinor * item.quantity, 'INR').format(
                            'en-IN'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Destination */}
                  <div className="text-xs text-muted-foreground border-t border-border/40 pt-2.5 flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Delivery Destination:</span>
                    <span className="truncate">
                      {ord.shippingAddress.line1}, {ord.shippingAddress.city},{' '}
                      {ord.shippingAddress.state} - {ord.shippingAddress.postalCode}
                    </span>
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
