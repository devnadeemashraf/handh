'use client';

import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptic';

import { COURIER_LABELS, type CourierProvider, resolveCourierTrackingUrl } from '@hh/domain';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

interface TrackingCardProps {
  fulfillment: Fulfillment | null;
  order: Order;
}

export default function TrackingCard({ fulfillment, order }: TrackingCardProps) {
  const [hasCopiedAwb, setHasCopiedAwb] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  const officialUrl = fulfillment
    ? resolveCourierTrackingUrl(
        fulfillment.courierProvider as CourierProvider,
        fulfillment.trackingNumber
      )
    : null;

  const copyAwb = async () => {
    if (!fulfillment) return;
    try {
      await navigator.clipboard.writeText(fulfillment.trackingNumber);
      triggerHaptic('success');
      setHasCopiedAwb(true);
      setTimeout(() => setHasCopiedAwb(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const shippingAddr = (order.shippingAddress || {}) as ShippingAddress;
  const isDelivered = fulfillment?.status === 'delivered';

  // Case 1: Pre-dispatch / In Workshop Preparation (no courier assigned yet)
  if (!fulfillment) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-royal/10 text-royal inline-flex items-center justify-center mb-3 border border-royal/20 text-base font-serif font-bold">
            H&amp;H
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight mb-1.5">
            Order Live Status
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground m-0">
            Order Reference:{' '}
            <span className="font-mono text-royal font-semibold tabular-nums">
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-card border border-border/80 rounded-md p-6 sm:p-7 shadow-xs flex flex-col gap-6">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-border/60 pb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-royal/10 text-royal flex items-center justify-center border border-royal/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold m-0">
                  Live Progress
                </p>
                <h2 className="text-base font-semibold text-foreground mt-0.5">
                  Workshop Preparation &amp; Packing
                </h2>
              </div>
            </div>

            <Badge
              variant="outline"
              className="px-3 py-1 gap-1.5 text-xs text-amber-700 bg-amber-500/10 border-amber-500/30"
            >
              <Clock className="h-3.5 w-3.5" />
              Order Confirmed
            </Badge>
          </div>

          {/* Desktop Horizontal Stepper */}
          <div className="hidden md:flex items-center justify-between px-2 pt-2 pb-6 border-b border-border/60 relative">
            <div className="absolute top-[28px] left-[30px] right-[30px] h-[2px] bg-border/60 z-0">
              <div
                className="h-full bg-royal transition-all duration-500"
                style={{ width: '40%' }}
              />
            </div>

            {/* Stage 1: Placed */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
              <div className="w-8 h-8 rounded-full bg-royal text-white flex items-center justify-center mb-1 text-xs">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Placed</span>
              <span className="text-[10px] text-muted-foreground">Confirmed</span>
            </div>

            {/* Stage 2: Payment */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
              <div className="w-8 h-8 rounded-full bg-royal text-white flex items-center justify-center mb-1 text-xs">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-foreground">Paid</span>
              <span className="text-[10px] text-muted-foreground">Captured</span>
            </div>

            {/* Stage 3: Processing (Active) */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
              <div className="w-8 h-8 rounded-full bg-royal text-white ring-4 ring-royal/30 animate-pulse flex items-center justify-center mb-1 text-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-royal">Processing</span>
              <span className="text-[10px] text-royal font-medium">Workshop</span>
            </div>

            {/* Stage 4: Shipped */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
              <div className="w-8 h-8 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center mb-1 text-xs">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-muted-foreground">Shipped</span>
              <span className="text-[10px] text-muted-foreground/70">Upcoming</span>
            </div>

            {/* Stage 5: Delivered */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
              <div className="w-8 h-8 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center mb-1 text-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-muted-foreground">Delivered</span>
              <span className="text-[10px] text-muted-foreground/70">Upcoming</span>
            </div>
          </div>

          {/* Stepper Timeline (Vertical for Mobile / Detailed View) */}
          <div className="flex flex-col gap-4">
            {/* Step 1: Order Confirmed */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-royal text-white flex items-center justify-center shrink-0 mt-0.5">
                <PackageCheck className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground m-0">
                  Order Confirmed &amp; Payment Captured
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transaction verified on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Step 2: Workshop Preparation (Active with pulsing ring) */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-royal text-white ring-4 ring-royal/30 animate-pulse flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-royal m-0">
                  Artisanal Quality Inspection &amp; Packing
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hand-crafted pieces are being individually examined and packed into bespoke
                  H&amp;H presentation boxes.
                </p>
              </div>
            </div>

            {/* Step 3: Courier Handover (Pending) */}
            <div className="flex items-start gap-3 opacity-60">
              <div className="w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground m-0">
                  Courier Handover &amp; Live Tracking
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consignment will be handed to DTDC / India Post / Delhivery with instant AWB
                  tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Destination & Info Card */}
          <div className="bg-secondary/40 border border-border/60 rounded-md p-4 flex flex-col gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-royal shrink-0" />
              <span>
                Shipping to: <strong>{order.customerName}</strong> — {shippingAddr.city},{' '}
                {shippingAddr.state} ({shippingAddr.postalCode})
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-royal shrink-0" />
              <span>Dispatches within 24-48 business hours from our Hyderabad atelier.</span>
            </div>
          </div>

          {/* Workshop Notice */}
          <div className="p-3.5 rounded-sm bg-royal/5 border border-royal/20 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Live Tracking Note:</strong> As soon as your parcel
            is collected by the courier, your live Air Waybill (AWB) consignment number and official
            tracking portal link will update on this page automatically.
          </div>
        </div>

        {/* Support & Inquiry Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            variant="outline"
            className="flex-1 h-10 border-border text-foreground hover:bg-secondary/50 rounded-sm"
          >
            <Link href={`/contact?order=${encodeURIComponent(order.orderNumber)}`}>
              <HelpCircle className="w-4 h-4 mr-2" />
              <span>Contact Support</span>
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="flex-1 h-10 border-border text-foreground hover:bg-secondary/50 rounded-sm"
          >
            <Link href="/shop">
              <Package className="w-4 h-4 mr-2" />
              <span>Explore Collection</span>
            </Link>
          </Button>
        </div>

        {/* Concierge Support Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="mb-1.5">Have questions about your order or customization?</p>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 text-royal hover:text-royal/80 transition-colors font-medium active:scale-[0.98]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat with H&amp;H Concierge on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // Case 2: Parcel has been dispatched with Courier Tracking
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      {/* Brand Header */}
      <div className="text-center">
        <div className="h-12 w-12 rounded-full bg-royal/10 text-royal inline-flex items-center justify-center mb-3 border border-royal/20 text-base font-serif font-bold">
          H&amp;H
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-foreground tracking-tight mb-1.5">
          Shipment Progress
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground m-0">
          Consignment Reference:{' '}
          <span className="font-mono text-royal font-semibold tabular-nums">
            {fulfillment.trackingReference}
          </span>
        </p>
      </div>

      {/* Main Status Card */}
      <div className="bg-card border border-border/80 rounded-md p-6 sm:p-7 shadow-xs flex flex-col gap-6">
        {/* Status Badge & Label */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-royal/10 text-royal flex items-center justify-center border border-royal/20 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold m-0">
                Status
              </p>
              <h2 className="text-base font-semibold text-foreground mt-0.5">
                {fulfillment.status === 'shipped' ? 'Handed to Courier (In Transit)' : 'Delivered'}
              </h2>
            </div>
          </div>

          <Badge
            variant="outline"
            className="px-3 py-1 gap-1.5 text-xs text-royal border-royal/30 bg-royal/5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Dispatch
          </Badge>
        </div>

        {/* Desktop Horizontal Stepper */}
        <div className="hidden md:flex items-center justify-between px-2 pt-2 pb-6 border-b border-border/60 relative">
          <div className="absolute top-[28px] left-[30px] right-[30px] h-[2px] bg-border/60 z-0">
            <div
              className="h-full bg-royal transition-all duration-500"
              style={{ width: isDelivered ? '100%' : '75%' }}
            />
          </div>

          {/* Step 1: Confirmed */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
            <div className="w-8 h-8 rounded-full bg-royal text-white flex items-center justify-center mb-1 text-xs">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Confirmed</span>
            <span className="text-[10px] text-muted-foreground">Paid</span>
          </div>

          {/* Step 2: Workshop Packed */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
            <div className="w-8 h-8 rounded-full bg-royal text-white flex items-center justify-center mb-1 text-xs">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-foreground">Packed</span>
            <span className="text-[10px] text-muted-foreground">Hyderabad</span>
          </div>

          {/* Step 3: In Transit (Active or Done) */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs ${
                isDelivered
                  ? 'bg-royal text-white'
                  : 'bg-royal text-white ring-4 ring-royal/30 animate-pulse'
              }`}
            >
              {isDelivered ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
            </div>
            <span
              className={`text-[11px] ${isDelivered ? 'font-semibold text-foreground' : 'font-bold text-royal'}`}
            >
              In Transit
            </span>
            <span className="text-[10px] text-muted-foreground">En Route</span>
          </div>

          {/* Step 4: Final Delivery */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-[90px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-xs ${
                isDelivered
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted border border-border text-muted-foreground'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span
              className={`text-[11px] ${isDelivered ? 'font-bold text-emerald-600' : 'text-muted-foreground'}`}
            >
              {isDelivered ? 'Delivery Complete' : 'Destination'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {isDelivered ? 'Doorstep Handover' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* Live Stepper (Vertical for Mobile) */}
        <div className="flex flex-col gap-4">
          {/* Step 1: Confirmed */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-royal text-white flex items-center justify-center shrink-0 mt-0.5">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground m-0">
                Order Confirmed &amp; Payment Captured
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Payment verified on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Step 2: Packed */}
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-royal text-white flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground m-0">
                Handcrafted &amp; Packed at Hyderabad Atelier
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Artisanal inspection completed and dispatched on {formatDate(fulfillment.shippedAt)}
              </p>
            </div>
          </div>

          {/* Step 3: In Transit */}
          <div className="flex items-start gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                fulfillment.status === 'delivered'
                  ? 'bg-royal text-white'
                  : 'bg-royal text-white ring-4 ring-royal/30 animate-pulse'
              }`}
            >
              <Truck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold m-0 ${
                  fulfillment.status === 'delivered' ? 'text-foreground' : 'text-royal'
                }`}
              >
                {fulfillment.status === 'delivered'
                  ? 'Courier Transit Completed'
                  : 'In Transit with Courier Partner'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Handed to{' '}
                {COURIER_LABELS[fulfillment.courierProvider as CourierProvider] ||
                  fulfillment.courierProvider}{' '}
                (AWB: {fulfillment.trackingNumber})
              </p>
            </div>
          </div>

          {/* Step 4: Delivered */}
          <div className="flex items-start gap-3">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                fulfillment.status === 'delivered'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted border border-border text-muted-foreground'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-semibold m-0 ${
                  fulfillment.status === 'delivered' ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                {fulfillment.status === 'delivered'
                  ? 'Delivered to Customer'
                  : 'Final Delivery to Destination'}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  fulfillment.status === 'delivered'
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60'
                }`}
              >
                {fulfillment.status === 'delivered'
                  ? `Successfully delivered on ${formatDate(
                      fulfillment.deliveredAt || fulfillment.updatedAt
                    )}`
                  : `Delivering to ${shippingAddr.city}, ${shippingAddr.state} (${shippingAddr.postalCode})`}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Courier Webhook Event Banner */}
        {fulfillment.latestEvent && (
          <div className="p-3.5 rounded-sm bg-secondary/60 border border-border/80 flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                fulfillment.status === 'delivered'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-royal shadow-[0_0_8px_rgba(30,58,138,0.5)]'
              }`}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Latest Courier Scan Update
              </span>
              <span className="text-xs sm:text-sm text-foreground font-medium">
                {fulfillment.latestEvent}
              </span>
            </div>
          </div>
        )}

        {/* Courier Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-3.5 rounded-sm bg-secondary/30 border border-border/60">
            <span className="text-xs text-muted-foreground">Courier Partner</span>
            <p className="text-sm font-semibold text-foreground m-0">
              {COURIER_LABELS[fulfillment.courierProvider as CourierProvider] ||
                fulfillment.courierProvider}
            </p>
          </div>

          <div className="flex flex-col gap-1 p-3.5 rounded-sm bg-secondary/30 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Consignment / AWB #</span>
              <button
                type="button"
                onClick={copyAwb}
                className="text-royal hover:text-royal/80 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                title="Copy tracking number"
              >
                {hasCopiedAwb ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{hasCopiedAwb ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-sm font-mono font-bold text-royal tabular-nums m-0">
              {fulfillment.trackingNumber}
            </p>
          </div>
        </div>

        {/* Timeline & Destination */}
        <div className="flex flex-col gap-2.5 text-xs sm:text-sm p-4 rounded-sm bg-secondary/30 border border-border/60">
          <div className="flex items-center gap-2.5 text-foreground">
            <Calendar className="h-4 w-4 text-royal shrink-0" />
            <span>Dispatched from Hyderabad workshop on {formatDate(fulfillment.shippedAt)}</span>
          </div>

          <div className="flex items-center gap-2.5 text-foreground border-t border-border/40 pt-2.5">
            <MapPin className="h-4 w-4 text-royal shrink-0" />
            <span>
              Destination: {shippingAddr.city}, {shippingAddr.state} ({shippingAddr.postalCode})
            </span>
          </div>
        </div>

        {/* Action Button: Track on Courier Portal */}
        {officialUrl ? (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('selection')}
            className="w-full min-h-11 text-sm font-medium bg-royal hover:bg-royal/90 text-white shadow-xs active:scale-[0.98] transition-transform duration-150 inline-flex items-center justify-center gap-2 rounded-sm"
          >
            <span>Track on Official Courier Website</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <div className="text-center p-3 rounded-sm bg-secondary/50 border border-border/60 text-xs text-muted-foreground">
            Please use your AWB number on the courier partner&apos;s mobile app or local counter.
          </div>
        )}

        {/* Collapsible Order & Delivery Summary (Spec 8.2) */}
        <div className="border border-border/60 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOrderSummary(!showOrderSummary)}
            className="w-full flex items-center justify-between p-3.5 bg-secondary/20 hover:bg-secondary/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors"
          >
            <span>Order &amp; Delivery Summary</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showOrderSummary ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showOrderSummary && (
            <div className="p-4 bg-card text-xs flex flex-col gap-3 border-t border-border/60">
              <div>
                <span className="text-muted-foreground">Shipping To:</span>
                <p className="font-medium text-foreground mt-0.5">
                  {order.customerName} — {shippingAddr.line1}
                  {shippingAddr.line2 ? `, ${shippingAddr.line2}` : ''}, {shippingAddr.city},{' '}
                  {shippingAddr.state} - {shippingAddr.postalCode}
                </p>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between">
                <span className="text-muted-foreground">Order Reference:</span>
                <span className="font-mono tabular-nums text-foreground">{order.orderNumber}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post-Fulfillment Support & Return Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          variant="outline"
          className="flex-1 h-10 border-border text-foreground hover:bg-secondary/50 rounded-sm"
        >
          <Link href={`/contact?order=${encodeURIComponent(order.orderNumber)}`}>
            <HelpCircle className="w-4 h-4 mr-2" />
            <span>Contact Support</span>
          </Link>
        </Button>

        {isDelivered && (
          <Button
            asChild
            variant="outline"
            className="flex-1 h-10 border-border text-foreground hover:bg-secondary/50 rounded-sm"
          >
            <Link href="/returns">
              <RotateCcw className="w-4 h-4 mr-2" />
              <span>Request Return / Exchange</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Concierge Support Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <p className="mb-1.5">Questions regarding your delivery schedule?</p>
        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => triggerHaptic('selection')}
          className="inline-flex items-center gap-1.5 text-royal hover:text-royal/80 transition-colors font-medium active:scale-[0.98]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Chat with H&amp;H Concierge on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
