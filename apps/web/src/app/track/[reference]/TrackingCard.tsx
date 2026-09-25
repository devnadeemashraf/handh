'use client';

import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck
} from 'lucide-react';
import { useState } from 'react';
import { triggerHaptic } from '@/lib/haptic';

import { COURIER_LABELS, type CourierProvider, resolveCourierTrackingUrl } from '@hh/domain';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

interface TrackingCardProps {
  fulfillment: Fulfillment | null;
  order: Order;
}

export default function TrackingCard({ fulfillment, order }: TrackingCardProps) {
  const [hasCopiedAwb, setHasCopiedAwb] = useState(false);

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

  const shippingAddr = order.shippingAddress as ShippingAddress;

  // Case 1: Pre-dispatch / In Workshop Preparation (no courier assigned yet)
  if (!fulfillment) {
    return (
      <div className="track-box flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-primary/20 text-accent inline-flex items-center justify-center mb-3 border border-primary/40 text-base font-serif">
            H&amp;H
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-1.5">
            Order Live Status
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground m-0">
            Order Reference:{' '}
            <span className="font-mono text-accent font-semibold">{order.orderNumber}</span>
          </p>
        </div>

        {/* Status Card */}
        <div className="admin-card flex flex-col gap-6 p-6 sm:p-7">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-border/60 pb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 text-accent flex items-center justify-center border border-primary/40 shrink-0">
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

            <span className="admin-badge admin-badge-amber px-3 py-1.5 gap-1.5 inline-flex items-center text-xs">
              <Clock className="h-3.5 w-3.5" />
              Order Confirmed
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="track-step-list">
            {/* Step 1: Order Confirmed */}
            <div className="track-step-item">
              <div className="track-step-icon done">
                <PackageCheck className="h-4.5 w-4.5" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-semibold text-foreground m-0">
                  Order Confirmed &amp; Payment Captured
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transaction verified on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Step 2: Workshop Preparation (Active) */}
            <div className="track-step-item">
              <div className="track-step-icon active">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-semibold text-accent m-0">
                  Artisanal Quality Inspection &amp; Packing
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hand-crafted pieces are being individually examined and packed into bespoke
                  H&amp;H gift boxes.
                </p>
              </div>
            </div>

            {/* Step 3: Courier Handover (Pending) */}
            <div className="track-step-item">
              <div className="track-step-icon pending">
                <Truck className="h-4.5 w-4.5" />
              </div>
              <div className="pt-1.5">
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
          <div className="admin-card-inner flex flex-col gap-2.5 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <span>
                Shipping to: <strong>{order.customerName}</strong> — {shippingAddr.city},{' '}
                {shippingAddr.state} ({shippingAddr.postalCode})
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 text-accent shrink-0" />
              <span>Dispatches within 24-48 business hours from our Hyderabad atelier.</span>
            </div>
          </div>

          {/* Workshop Notice */}
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Live Tracking Note:</strong> As soon as your parcel
            is collected by the courier, your live Air Waybill (AWB) consignment number and official
            tracking portal link will update on this page automatically.
          </div>
        </div>

        {/* Concierge Support Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p className="mb-1.5">Have questions about your order or customization?</p>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors font-medium active:scale-[0.98]"
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
    <div className="track-box flex flex-col gap-6">
      {/* Brand Header */}
      <div className="text-center">
        <div className="h-12 w-12 rounded-full bg-primary/20 text-accent inline-flex items-center justify-center mb-3 border border-primary/40 text-base font-serif">
          H&amp;H
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground mb-1.5">
          Shipment Progress
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground m-0">
          Consignment Reference:{' '}
          <span className="font-mono text-accent font-semibold">
            {fulfillment.trackingReference}
          </span>
        </p>
      </div>

      {/* Main Status Card */}
      <div className="admin-card flex flex-col gap-6 p-6 sm:p-7">
        {/* Status Badge & Animation */}
        <div className="flex items-center justify-between border-b border-border/60 pb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-accent flex items-center justify-center border border-primary/40 shrink-0">
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

          <span className="admin-badge admin-badge-emerald px-3 py-1.5 gap-1.5 inline-flex items-center text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Dispatch
          </span>
        </div>

        {/* Live 4-Stage Stepper */}
        <div className="track-step-list">
          {/* Step 1: Confirmed */}
          <div className="track-step-item">
            <div className="track-step-icon done">
              <PackageCheck className="h-4.5 w-4.5" />
            </div>
            <div className="pt-1.5">
              <p className="text-sm font-semibold text-foreground m-0">
                Order Confirmed &amp; Payment Captured
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Payment verified on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Step 2: Packed */}
          <div className="track-step-item">
            <div className="track-step-icon done">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="pt-1.5">
              <p className="text-sm font-semibold text-foreground m-0">
                Handcrafted &amp; Packed at Hyderabad Atelier
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Artisanal inspection completed and dispatched on {formatDate(fulfillment.shippedAt)}
              </p>
            </div>
          </div>

          {/* Step 3: In Transit */}
          <div className="track-step-item">
            <div
              className={`track-step-icon ${
                fulfillment.status === 'delivered' ? 'done' : 'active'
              }`}
            >
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div className="pt-1.5">
              <p
                className={`text-sm font-semibold m-0 ${
                  fulfillment.status === 'delivered' ? 'text-foreground' : 'text-accent'
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
          <div className="track-step-item">
            <div
              className={`track-step-icon ${
                fulfillment.status === 'delivered' ? 'done' : 'pending'
              }`}
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
            </div>
            <div className="pt-1.5">
              <p
                className={`text-sm font-semibold m-0 ${
                  fulfillment.status === 'delivered' ? 'text-emerald-400' : 'text-muted-foreground'
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
                  ? `Successfully delivered on ${formatDate(fulfillment.deliveredAt || fulfillment.updatedAt)}`
                  : `Delivering to ${shippingAddr.city}, ${shippingAddr.state} (${shippingAddr.postalCode})`}
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Courier Webhook Event Banner */}
        {fulfillment.latestEvent && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-primary/20 border border-primary/40 flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                fulfillment.status === 'delivered'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-accent shadow-[0_0_8px_rgba(197,168,128,0.8)]'
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
          <div className="admin-card-inner flex flex-col gap-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <span className="text-xs text-muted-foreground">Courier Partner</span>
            <p className="text-sm font-semibold text-foreground m-0">
              {COURIER_LABELS[fulfillment.courierProvider as CourierProvider] ||
                fulfillment.courierProvider}
            </p>
          </div>

          <div className="admin-card-inner flex flex-col gap-1 p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Consignment / AWB #</span>
              <button
                type="button"
                onClick={copyAwb}
                className="text-accent hover:text-accent/80 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
                title="Copy tracking number"
              >
                {hasCopiedAwb ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{hasCopiedAwb ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-sm font-mono font-bold text-accent m-0">
              {fulfillment.trackingNumber}
            </p>
          </div>
        </div>

        {/* Timeline & Destination */}
        <div className="admin-card-inner flex flex-col gap-2.5 text-xs sm:text-sm p-4 rounded-xl bg-muted/20 border border-border/60">
          <div className="flex items-center gap-2.5 text-foreground">
            <Calendar className="h-4 w-4 text-accent shrink-0" />
            <span>Dispatched from Hyderabad workshop on {formatDate(fulfillment.shippedAt)}</span>
          </div>

          <div className="flex items-center gap-2.5 text-foreground border-t border-border/40 pt-2.5">
            <MapPin className="h-4 w-4 text-accent shrink-0" />
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
            className="admin-btn-primary w-full min-h-12 text-sm font-medium shadow-md active:scale-[0.98] transition-transform duration-150 inline-flex items-center justify-center gap-2 rounded-xl"
          >
            <span>Track on Official Courier Website</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : (
          <div className="text-center p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-muted-foreground">
            Please use your AWB number on the courier partner&apos;s mobile app or local counter.
          </div>
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
          className="inline-flex items-center gap-1.5 text-accent hover:text-accent/80 transition-colors font-medium active:scale-[0.98]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>Chat with H&amp;H Concierge on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
