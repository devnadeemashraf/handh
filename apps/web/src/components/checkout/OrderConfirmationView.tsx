'use client';

import {
  ArrowLeft,
  Check,
  Copy,
  Package,
  Printer,
  ShieldCheck,
  Truck,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { triggerHaptic } from '@/lib/haptic';

import { formatIndianPhoneDisplay, Money } from '@hh/domain';

import type { Order, OrderItem, ShippingAddress } from '@hh/db';

export interface OrderConfirmationViewProps {
  order: Order & { items: OrderItem[] };
  token?: string | undefined;
  isGuest?: boolean;
}

export function OrderConfirmationView({
  order,
  token: _token,
  isGuest = false
}: OrderConfirmationViewProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [guestDismissed, setGuestDismissed] = useState(false);

  // Extract customer first name
  const firstName = order.customerName ? order.customerName.trim().split(' ')[0] : 'Patron';

  // Compute estimated delivery window (3 to 5 business days from order creation)
  const orderDate = new Date(order.createdAt);
  const estStart = new Date(orderDate);
  estStart.setDate(estStart.getDate() + 3);
  const estEnd = new Date(orderDate);
  estEnd.setDate(estEnd.getDate() + 5);

  const formatDateRange = (d1: Date, d2: Date) => {
    const opt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = d1.toLocaleDateString('en-IN', opt);
    const endStr = d2.toLocaleDateString('en-IN', { ...opt, year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  const deliveryWindow = formatDateRange(estStart, estEnd);

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      triggerHaptic('success');
      addToast({
        title: 'Copied to clipboard',
        description: `Order reference ${order.orderNumber} copied.`
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrintInvoice = () => {
    triggerHaptic('selection');
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const isPaid = order.status === 'paid' || order.paymentStatus === 'captured';
  const shippingAddr = (order.shippingAddress || {}) as ShippingAddress;

  return (
    <div className="min-h-screen bg-sand/30 py-10 sm:py-16 px-4 sm:px-6">
      <div className="max-w-[640px] mx-auto flex flex-col gap-6">
        {/* 1. Success Moment Hero */}
        <div className="bg-card border border-border/80 rounded-md p-6 sm:p-10 text-center shadow-xs">
          {/* Animated stroke-draw checkmark */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-royal/5 border border-royal/20 text-royal mb-4">
            <svg
              className="w-8 h-8 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline
                points="20 6 9 17 4 12"
                style={{
                  strokeDasharray: 24,
                  strokeDashoffset: 0,
                  animation: 'stroke-draw 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}
              />
            </svg>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-foreground tracking-tight mb-2">
            Thank you, {firstName}.
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Your order is confirmed and handcrafted with care.
          </p>

          {/* Copyable Order Reference */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 border border-border/60 rounded-md text-xs sm:text-sm text-muted-foreground font-mono tabular-nums">
            <span>Order #{order.orderNumber}</span>
            <button
              type="button"
              onClick={copyOrderNumber}
              className="text-foreground hover:text-royal transition-colors p-1 -m-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-royal rounded-sm"
              aria-label="Copy order reference"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-royal" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            A confirmation dispatch has been routed to{' '}
            <strong className="text-foreground">{order.customerEmail}</strong>.
          </p>
        </div>

        {/* 2. Priority Estimated Delivery Card */}
        <div className="bg-card border border-border/80 rounded-md p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-royal">
              <Truck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Delivery Window
              </span>
            </div>
            <Badge variant="outline" className="text-xs text-royal border-royal/30 bg-royal/5">
              Standard Express
            </Badge>
          </div>

          <div>
            <div className="font-serif text-xl sm:text-2xl font-medium text-foreground tracking-tight">
              {deliveryWindow}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dispatches from our Hyderabad atelier via insured courier network.
            </p>
          </div>

          <div className="bg-secondary/40 border border-border/60 rounded-md p-3.5 text-xs text-muted-foreground flex flex-col gap-1">
            <div className="flex items-start gap-2.5">
              <Package className="w-4 h-4 text-royal shrink-0 mt-0.5" />
              <div>
                <div>
                  <strong className="text-foreground">{order.customerName}</strong>
                </div>
                <div>{shippingAddr.line1}</div>
                {shippingAddr.line2 && <div>{shippingAddr.line2}</div>}
                <div>
                  {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postalCode}
                </div>
                {order.customerPhone && (
                  <div className="mt-1 text-muted-foreground font-mono tabular-nums">
                    Contact: {formatIndianPhoneDisplay(order.customerPhone)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Purchased Items Snapshot & Financial Breakup */}
        <div className="bg-card border border-border/80 rounded-md p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Order Summary ({order.items.length} {order.items.length === 1 ? 'item' : 'items'})
            </h2>
            <span className="text-xs font-mono tabular-nums text-muted-foreground">
              {isPaid ? 'Payment Captured' : 'Payment Pending'}
            </span>
          </div>

          {/* Line items row */}
          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
                {/* 4:5 aspect ratio thumbnail */}
                <div className="w-12 h-15 bg-muted/40 rounded-sm border border-border/60 flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                  <Package className="w-5 h-5 opacity-40" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.productNameSnapshot}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.variantNameSnapshot} · Qty: {item.quantity}
                  </p>
                </div>

                <div className="text-sm font-mono tabular-nums font-medium text-foreground shrink-0">
                  {Money.fromMinor(item.totalPriceMinor, 'INR').format('en-IN')}
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="pt-3 border-t border-border/60 text-xs flex flex-col gap-2 font-mono tabular-nums">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{Money.fromMinor(order.subtotalMinor, 'INR').format('en-IN')}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Courier Shipping</span>
              <span>
                {order.shippingMinor === 0
                  ? 'FREE'
                  : Money.fromMinor(order.shippingMinor, 'INR').format('en-IN')}
              </span>
            </div>
            {order.discountMinor > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied</span>
                <span>-{Money.fromMinor(order.discountMinor, 'INR').format('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/60">
              <span className="font-sans">Total Paid</span>
              <span className="text-royal">
                {Money.fromMinor(order.totalMinor, 'INR').format('en-IN')}
              </span>
            </div>
          </div>

          {/* Statutory Tax Invoice CTA */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-royal" />
              <span>Includes statutory GST breakdown</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintInvoice}
              className="h-8 gap-1.5 text-xs font-medium rounded-sm border-border hover:bg-secondary/60"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </Button>
          </div>
        </div>

        {/* 4. Guest Account Registration Prompt (if applicable) */}
        {isGuest && !guestDismissed && (
          <div className="bg-secondary/30 border border-royal/20 rounded-md p-5 shadow-xs relative">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-sm bg-royal/10 text-royal flex items-center justify-center shrink-0 mt-0.5">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">
                  Save your details for faster checkout next time
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Track orders live, save multiple delivery addresses, and maintain a bespoke
                  wishlist.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="h-8 text-xs font-medium bg-royal hover:bg-royal/90 text-white rounded-sm"
                  >
                    <Link href={`/account?claimOrder=${order.orderNumber}`}>Create Account</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGuestDismissed(true)}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-sm"
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Navigation Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="flex-1 h-11 bg-royal hover:bg-royal/90 text-white font-medium rounded-sm active:scale-[0.98] transition-transform"
          >
            <Link
              href={`/track/${order.orderNumber}`}
              className="inline-flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Your Order</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 h-11 border-border text-foreground hover:bg-secondary/50 font-medium rounded-sm active:scale-[0.98] transition-transform"
          >
            <Link href="/shop" className="inline-flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </Button>
        </div>

        {/* 6. Support Info Footer */}
        <div className="text-center pt-2 pb-6 text-xs text-muted-foreground">
          Questions about your order?{' '}
          <Link
            href={`/contact?order=${encodeURIComponent(order.orderNumber)}`}
            className="text-royal font-medium underline underline-offset-2 hover:text-royal/80"
          >
            Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  );
}
