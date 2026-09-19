'use client';

import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  Receipt,
  Send,
  Sparkles,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { COURIER_LABELS, type CourierProvider, resolveCourierTrackingUrl } from '@hh/domain';

import type { Fulfillment, Order, ShippingAddress } from '@hh/db';

interface OrderFulfillmentActionsProps {
  order: Order & { shippingAddress: ShippingAddress };
  initialFulfillments: Fulfillment[];
}

export default function OrderFulfillmentActions({
  order,
  initialFulfillments
}: OrderFulfillmentActionsProps) {
  const router = useRouter();

  const [fulfillments, setFulfillments] = useState<Fulfillment[]>(initialFulfillments);
  const [orderStatus, setOrderStatus] = useState(order.status);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillmentStatus);

  // Active Dispatch Mode: 'doorstep' | 'counter'
  const [dispatchMode, setDispatchMode] = useState<'doorstep' | 'counter'>('doorstep');

  // Address copy state
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  // Mode 1: Doorstep Pickup Form State
  const [doorstepProvider, setDoorstepProvider] = useState<'shiprocket' | 'delhivery'>(
    'shiprocket'
  );
  const [weightGrams, setWeightGrams] = useState(200);
  const [lengthCm, setLengthCm] = useState(15);
  const [widthCm, setWidthCm] = useState(10);
  const [heightCm, setHeightCm] = useState(5);
  const [doorstepNotes, setDoorstepNotes] = useState('');
  const [isBookingPickup, setIsBookingPickup] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupSuccess, setPickupSuccess] = useState<{
    awb: string;
    labelUrl?: string | undefined;
    pickupToken?: string | undefined;
  } | null>(null);

  // Mode 2: Counter Drop-Off Form State
  const [courierProvider, setCourierProvider] = useState<CourierProvider>('dtdc');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [registerWithTracker, setRegisterWithTracker] = useState(true);
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);

  // Status transition state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Copy courier label address to clipboard
  const copyAddressToClipboard = async () => {
    const addr = order.shippingAddress;
    const formatted = [
      order.customerName,
      addr.line1,
      addr.line2,
      `${addr.city}, ${addr.state} - ${addr.postalCode}`,
      addr.country || 'India',
      `Phone: ${order.customerPhone}`
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setHasCopiedAddress(true);
      setTimeout(() => setHasCopiedAddress(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Submit Mode 1: Automated Doorstep Pickup Booking
  const handleDoorstepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingPickup(true);
    setPickupError(null);
    setPickupSuccess(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/book-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: doorstepProvider,
          weightGrams,
          lengthCm,
          widthCm,
          heightCm,
          notes: doorstepNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPickupError(data.error || 'Failed to schedule doorstep courier pickup.');
        setIsBookingPickup(false);
        return;
      }

      setFulfillments((prev) => [data.fulfillment, ...prev]);
      setFulfillmentStatus('shipped');
      if (orderStatus === 'paid') {
        setOrderStatus('processing');
      }

      setPickupSuccess({
        awb: data.pickupResult.awb,
        labelUrl: data.pickupResult.labelUrl,
        pickupToken: data.pickupResult.pickupToken
      });
      setIsBookingPickup(false);
      setDoorstepNotes('');
      router.refresh();
    } catch {
      setPickupError('A network error occurred while booking doorstep pickup.');
      setIsBookingPickup(false);
    }
  };

  // Submit Mode 2: Manual Counter Drop-Off
  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSubmittingCounter(true);
    setCounterError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierProvider,
          trackingNumber: trackingNumber.trim(),
          registerWithTracker,
          notes: counterNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCounterError(data.error || 'Failed to record counter fulfillment.');
        setIsSubmittingCounter(false);
        return;
      }

      setFulfillments((prev) => [data.fulfillment, ...prev]);
      setFulfillmentStatus('shipped');
      if (orderStatus === 'paid') {
        setOrderStatus('processing');
      }

      setTrackingNumber('');
      setCounterNotes('');
      setIsSubmittingCounter(false);
      router.refresh();
    } catch {
      setCounterError('A network error occurred while recording counter dispatch.');
      setIsSubmittingCounter(false);
    }
  };

  // Update order status (state machine)
  const handleStatusTransition = async (newStatus: 'processing' | 'completed') => {
    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatusError(data.error || 'Failed to update order status.');
        setIsUpdatingStatus(false);
        return;
      }

      setOrderStatus(newStatus);
      setIsUpdatingStatus(false);
      router.refresh();
    } catch {
      setStatusError('A network error occurred while updating status.');
      setIsUpdatingStatus(false);
    }
  };

  const digits = order.customerPhone.replace(/\D/g, '');
  const cleanPhone = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, this is regarding your H&H order ${order.orderNumber}.`
  )}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Customer Communication Bar */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer Contact
            </p>
            <p className="text-sm sm:text-base font-semibold text-foreground">
              {order.customerName} ({order.customerPhone})
            </p>
            <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:+91${cleanPhone}`}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted font-medium text-xs text-foreground transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-accent" />
              <span>Call</span>
            </a>

            <Button
              variant="outline"
              size="sm"
              onClick={copyAddressToClipboard}
              className="h-8 gap-1.5 text-xs"
              title="Copy address for courier dispatch label"
            >
              {hasCopiedAddress ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Label</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Printable Invoices & Packing Slips Bar */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Printer className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Order Documentation &amp; Print
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                One-click tax invoices (A4) and thermal logistics slips (4x6&quot;) with custom
                brand details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href={`/admin/orders/${order.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-accent/40 bg-accent/5 hover:bg-accent/15 text-accent font-medium text-xs transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Print Tax Invoice (A4)</span>
            </Link>

            <Link
              href={`/admin/orders/${order.id}/packing-slip`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Thermal Slip (4x6&quot;)</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Fulfillment Status & History */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center justify-between gap-4 border-b border-border space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Shipment &amp; Courier Logistics
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {fulfillments.length === 0
                  ? 'Parcel has not yet been dispatched.'
                  : `${fulfillments.length} courier dispatch record(s) active.`}
              </p>
            </div>
          </div>

          {fulfillmentStatus === 'shipped' ? (
            <Badge variant="default" className="gap-1 text-xs">
              <Truck className="h-3.5 w-3.5" />
              <span>In Transit</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>To Pack</span>
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex flex-col gap-5">
          {/* Existing Fulfillments List with PDF Label & Live Webhook Scan */}
          {fulfillments.length > 0 && (
            <div className="flex flex-col gap-3">
              {fulfillments.map((fulf) => {
                const officialUrl = resolveCourierTrackingUrl(
                  fulf.courierProvider,
                  fulf.trackingNumber
                );
                return (
                  <div
                    key={fulf.id}
                    className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-sm">
                            {COURIER_LABELS[fulf.courierProvider] || fulf.courierProvider}
                          </span>
                          <Badge variant="secondary" className="font-mono text-xs text-accent">
                            AWB: {fulf.trackingNumber}
                          </Badge>
                          {fulf.shippingProviderId && fulf.shippingProviderId !== 'manual' && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              Adapter: {fulf.shippingProviderId}
                            </Badge>
                          )}
                          {fulf.pickupToken && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            >
                              Pickup Token: {fulf.pickupToken}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs font-mono text-muted-foreground">
                          Tracking Ref: {fulf.trackingReference}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {fulf.labelUrl && (
                          <a
                            href={fulf.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors"
                            title="Print or download courier shipping label"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Download Label</span>
                          </a>
                        )}

                        <a
                          href={`/track/${fulf.trackingReference}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-accent font-medium text-xs transition-colors"
                        >
                          <span>Customer Page</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        {officialUrl && (
                          <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-medium text-xs transition-colors"
                          >
                            <span>Courier Portal</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Real-time Webhook Scan Milestone */}
                    {fulf.latestEvent && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-accent/10 border border-accent/20 text-xs text-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>
                          <strong className="text-accent font-semibold">
                            Latest Courier Scan:
                          </strong>{' '}
                          {fulf.latestEvent}
                        </span>
                      </div>
                    )}

                    {fulf.notes && (
                      <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                        Notes: {fulf.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Dual-Mode Dispatch Selection Tabs */}
          <div className="border-t border-border pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {fulfillments.length === 0 ? 'Dispatch Shipment' : 'Add Additional Tracking'}
              </h4>

              <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setDispatchMode('doorstep')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1 text-xs font-medium transition-colors select-none',
                    dispatchMode === 'doorstep'
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Doorstep Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDispatchMode('counter')}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1 text-xs font-medium transition-colors select-none',
                    dispatchMode === 'counter'
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Counter Drop-Off</span>
                </button>
              </div>
            </div>

            {/* MODE 1: Doorstep Pickup Booking Form */}
            {dispatchMode === 'doorstep' && (
              <form onSubmit={handleDoorstepSubmit} className="flex flex-col gap-4">
                {pickupError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pickupError}</span>
                  </div>
                )}

                {pickupSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        Pickup booked! AWB: <strong>{pickupSuccess.awb}</strong>
                        {pickupSuccess.pickupToken && ` (Token: ${pickupSuccess.pickupToken})`}
                      </span>
                    </div>
                    {pickupSuccess.labelUrl && (
                      <a
                        href={pickupSuccess.labelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-emerald-500/40 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Print Label</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Origin Atelier Callout */}
                <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Hyderabad Atelier Dispatch Origin:</strong>
                    <br />
                    H&amp;H Artisan Atelier, Banjara Hills Road No 10, Hyderabad, Telangana - 500034
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Courier Logistics Provider
                    </label>
                    <select
                      value={doorstepProvider}
                      onChange={(e) =>
                        setDoorstepProvider(e.target.value as 'shiprocket' | 'delhivery')
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <option value="shiprocket">Shiprocket (Multi-Courier Aggregator)</option>
                      <option value="delhivery">Delhivery Direct Express</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Package Weight (Grams)
                    </label>
                    <Input
                      type="number"
                      required
                      min={1}
                      value={weightGrams}
                      onChange={(e) => setWeightGrams(parseInt(e.target.value, 10) || 200)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Length (cm)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={lengthCm}
                      onChange={(e) => setLengthCm(parseInt(e.target.value, 10) || 15)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Width (cm)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={widthCm}
                      onChange={(e) => setWidthCm(parseInt(e.target.value, 10) || 10)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Height (cm)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 5)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground font-medium">
                    Pickup &amp; Handling Instructions (Optional)
                  </label>
                  <Input
                    type="text"
                    value={doorstepNotes}
                    onChange={(e) => setDoorstepNotes(e.target.value)}
                    placeholder="e.g. Fragile silver jewelry, collect after 2 PM"
                  />
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={
                      isBookingPickup || (orderStatus !== 'paid' && orderStatus !== 'processing')
                    }
                    className="gap-2"
                  >
                    {isBookingPickup ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Booking Courier Pickup...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        <span>Schedule Doorstep Pickup &amp; Generate Label</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* MODE 2: Counter Drop-Off Form */}
            {dispatchMode === 'counter' && (
              <form onSubmit={handleCounterSubmit} className="flex flex-col gap-4">
                {counterError && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{counterError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Counter Courier Partner
                    </label>
                    <select
                      value={courierProvider}
                      onChange={(e) => setCourierProvider(e.target.value as CourierProvider)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      <option value="dtdc">DTDC Express</option>
                      <option value="india_post">India Post (Speed Post)</option>
                      <option value="delhivery">Delhivery</option>
                      <option value="bluedart">Blue Dart</option>
                      <option value="other">Other / Local Courier</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-muted-foreground font-medium">
                      Tracking Number (AWB / Consignment #)
                    </label>
                    <Input
                      type="text"
                      required
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="e.g. DTDC12345678 or EM123456789IN"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-muted-foreground font-medium">
                    Counter Dispatch Notes (Optional)
                  </label>
                  <Input
                    type="text"
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    placeholder="e.g. Handed over at Banjara Hills post office counter"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableWebhookTracker"
                    checked={registerWithTracker}
                    onChange={(e) => setRegisterWithTracker(e.target.checked)}
                    className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="enableWebhookTracker"
                    className="text-xs text-muted-foreground cursor-pointer"
                  >
                    Enable automated delivery tracking via universal courier webhook adapter
                  </label>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmittingCounter || !trackingNumber.trim()}
                    className="gap-2"
                  >
                    {isSubmittingCounter ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Recording Dispatch...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Record Counter Dispatch &amp; Link Tracking</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order State Transition Controls */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 border-b border-border space-y-0">
          <CardTitle className="text-base font-semibold">Order Lifecycle Status</CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
          {statusError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{statusError}</span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {orderStatus === 'paid' && (
              <Button
                variant="outline"
                onClick={() => handleStatusTransition('processing')}
                disabled={isUpdatingStatus}
                className="gap-2 text-xs"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>Move to In-Preparation (Processing)</span>
              </Button>
            )}

            {orderStatus === 'processing' && (
              <Button
                variant="outline"
                onClick={() => handleStatusTransition('completed')}
                disabled={isUpdatingStatus}
                className="gap-2 text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <span>Mark Order as Delivered &amp; Completed</span>
              </Button>
            )}

            {orderStatus === 'completed' && (
              <Badge variant="default" className="px-3 py-1.5 text-xs gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Order is fulfilled and completed.</span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
