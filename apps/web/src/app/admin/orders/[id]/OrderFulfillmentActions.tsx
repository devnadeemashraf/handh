'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Copy,
  Check,
  Phone,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Send,
  Building2,
  FileText,
  MapPin,
  Sparkles
} from 'lucide-react';
import { COURIER_LABELS, resolveCourierTrackingUrl, type CourierProvider } from '@hh/domain';
import type { Order, Fulfillment, ShippingAddress } from '@hh/db';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Quick Customer Communication Bar */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#8BAAA0',
              fontWeight: 600,
              margin: 0
            }}
          >
            Customer Contact
          </p>
          <p
            style={{
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: '#FDFBF7',
              margin: 0
            }}
          >
            {order.customerName} ({order.customerPhone})
          </p>
          <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: 0 }}>{order.customerEmail}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="admin-btn-wa">
            <MessageSquare style={{ width: '16px', height: '16px' }} />
            <span>WhatsApp</span>
          </a>

          <a href={`tel:+91${cleanPhone}`} className="admin-btn-secondary">
            <Phone style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Call</span>
          </a>

          <button
            onClick={copyAddressToClipboard}
            className="admin-btn-secondary"
            title="Copy address for courier dispatch label"
          >
            {hasCopiedAddress ? (
              <>
                <Check style={{ width: '16px', height: '16px', color: '#34D399' }} />
                <span style={{ color: '#34D399' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy style={{ width: '16px', height: '16px' }} />
                <span>Copy Label</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fulfillment Status & History */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#164335',
                color: '#C5A880',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #235847'
              }}
            >
              <Truck style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontFamily: 'serif',
                  color: '#FDFBF7',
                  margin: 0
                }}
              >
                Shipment &amp; Courier Logistics
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                {fulfillments.length === 0
                  ? 'Parcel has not yet been dispatched.'
                  : `${fulfillments.length} courier dispatch record(s) active.`}
              </p>
            </div>
          </div>

          {fulfillmentStatus === 'shipped' ? (
            <span className="admin-badge admin-badge-sky">
              <Truck style={{ width: '14px', height: '14px' }} />
              In Transit
            </span>
          ) : (
            <span className="admin-badge admin-badge-amber">
              <Clock style={{ width: '14px', height: '14px' }} />
              To Pack
            </span>
          )}
        </div>

        {/* Existing Fulfillments List with PDF Label & Live Webhook Scan */}
        {fulfillments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fulfillments.map((fulf) => {
              const officialUrl = resolveCourierTrackingUrl(
                fulf.courierProvider,
                fulf.trackingNumber
              );
              return (
                <div
                  key={fulf.id}
                  className="admin-card-inner"
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#FDFBF7'
                          }}
                        >
                          {COURIER_LABELS[fulf.courierProvider] || fulf.courierProvider}
                        </span>
                        <span
                          className="admin-badge admin-badge-gold"
                          style={{ fontFamily: 'monospace' }}
                        >
                          AWB: {fulf.trackingNumber}
                        </span>
                        {fulf.shippingProviderId && fulf.shippingProviderId !== 'manual' && (
                          <span
                            className="admin-badge admin-badge-sky"
                            style={{ textTransform: 'capitalize', fontSize: '0.6875rem' }}
                          >
                            Adapter: {fulf.shippingProviderId}
                          </span>
                        )}
                        {fulf.pickupToken && (
                          <span
                            className="admin-badge admin-badge-emerald"
                            style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}
                          >
                            Pickup Token: {fulf.pickupToken}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#8BAAA0',
                          margin: 0
                        }}
                      >
                        Tracking Ref: {fulf.trackingReference}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      {fulf.labelUrl && (
                        <a
                          href={fulf.labelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn-secondary"
                          style={{
                            minHeight: '36px',
                            padding: '6px 12px',
                            color: '#34D399',
                            borderColor: 'rgba(52, 211, 153, 0.4)'
                          }}
                          title="Print or download courier shipping label"
                        >
                          <FileText style={{ width: '13px', height: '13px' }} />
                          <span>Download Label</span>
                        </a>
                      )}

                      <a
                        href={`/track/${fulf.trackingReference}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-btn-secondary"
                        style={{
                          minHeight: '36px',
                          padding: '6px 12px',
                          color: '#C5A880',
                          borderColor: '#1C4D3E'
                        }}
                      >
                        <span>Customer Page</span>
                        <ExternalLink style={{ width: '12px', height: '12px' }} />
                      </a>

                      {officialUrl && (
                        <a
                          href={officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn-secondary"
                          style={{ minHeight: '36px', padding: '6px 12px' }}
                        >
                          <span>Courier Portal</span>
                          <ExternalLink style={{ width: '12px', height: '12px' }} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Real-time Webhook Scan Milestone */}
                  {fulf.latestEvent && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(22, 67, 53, 0.4)',
                        border: '1px solid #1C4D3E',
                        fontSize: '0.75rem',
                        color: '#E8ECE9'
                      }}
                    >
                      <Sparkles
                        style={{ width: '13px', height: '13px', color: '#C5A880', flexShrink: 0 }}
                      />
                      <span>
                        <strong style={{ color: '#C5A880' }}>Latest Courier Scan:</strong>{' '}
                        {fulf.latestEvent}
                      </span>
                    </div>
                  )}

                  {fulf.notes && (
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: '#A0C0B5',
                        fontStyle: 'italic',
                        borderTop: '1px solid #1C4D3E',
                        paddingTop: '8px',
                        margin: 0
                      }}
                    >
                      Notes: {fulf.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Dual-Mode Dispatch Selection Tabs */}
        <div style={{ borderTop: '1px solid #1C4D3E', paddingTop: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <h4
              style={{
                fontSize: '0.8125rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#A0C0B5',
                fontWeight: 600,
                margin: 0
              }}
            >
              {fulfillments.length === 0 ? 'Dispatch Shipment' : 'Add Additional Tracking'}
            </h4>

            <div className="admin-tabs-bar">
              <button
                type="button"
                onClick={() => setDispatchMode('doorstep')}
                className={`admin-tab-btn ${dispatchMode === 'doorstep' ? 'active' : ''}`}
              >
                <Truck style={{ width: '14px', height: '14px' }} />
                <span>Doorstep Pickup</span>
              </button>
              <button
                type="button"
                onClick={() => setDispatchMode('counter')}
                className={`admin-tab-btn ${dispatchMode === 'counter' ? 'active' : ''}`}
              >
                <Building2 style={{ width: '14px', height: '14px' }} />
                <span>Counter Drop-Off</span>
              </button>
            </div>
          </div>

          {/* MODE 1: Doorstep Pickup Booking Form */}
          {dispatchMode === 'doorstep' && (
            <form
              onSubmit={handleDoorstepSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {pickupError && (
                <div className="admin-alert-error">
                  <AlertCircle
                    style={{ width: '16px', height: '16px', flexShrink: 0, color: '#F87171' }}
                  />
                  <span>{pickupError}</span>
                </div>
              )}

              {pickupSuccess && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    color: '#34D399',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', flexShrink: 0 }} />
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
                      className="admin-btn-secondary"
                      style={{
                        padding: '4px 10px',
                        minHeight: '32px',
                        color: '#34D399',
                        borderColor: 'rgba(52, 211, 153, 0.5)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <FileText style={{ width: '12px', height: '12px' }} />
                      <span>Print Label</span>
                    </a>
                  )}
                </div>
              )}

              {/* Origin Atelier Callout */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0A251D',
                  border: '1px solid #1C4D3E',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}
              >
                <MapPin
                  style={{
                    width: '16px',
                    height: '16px',
                    color: '#C5A880',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#8BAAA0', lineHeight: 1.5 }}>
                  <strong style={{ color: '#FDFBF7' }}>Hyderabad Atelier Dispatch Origin:</strong>
                  <br />
                  H&amp;H Artisan Atelier, Banjara Hills Road No 10, Hyderabad, Telangana - 500034
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Courier Logistics Provider
                  </label>
                  <select
                    value={doorstepProvider}
                    onChange={(e) =>
                      setDoorstepProvider(e.target.value as 'shiprocket' | 'delhivery')
                    }
                    className="admin-select"
                  >
                    <option value="shiprocket">Shiprocket (Multi-Courier Aggregator)</option>
                    <option value="delhivery">Delhivery Direct Express</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Package Weight (Grams)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(parseInt(e.target.value, 10) || 200)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lengthCm}
                    onChange={(e) => setLengthCm(parseInt(e.target.value, 10) || 15)}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={widthCm}
                    onChange={(e) => setWidthCm(parseInt(e.target.value, 10) || 10)}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 5)}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    marginBottom: '6px'
                  }}
                >
                  Pickup &amp; Handling Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={doorstepNotes}
                  onChange={(e) => setDoorstepNotes(e.target.value)}
                  placeholder="e.g. Fragile silver jewelry, collect after 2 PM"
                  className="admin-input"
                />
              </div>

              <div style={{ paddingTop: '4px' }}>
                <button
                  type="submit"
                  disabled={
                    isBookingPickup || (orderStatus !== 'paid' && orderStatus !== 'processing')
                  }
                  className="admin-btn-primary"
                >
                  {isBookingPickup ? (
                    <>
                      <Loader2
                        style={{
                          width: '16px',
                          height: '16px',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                      <span>Booking Courier Pickup...</span>
                    </>
                  ) : (
                    <>
                      <Truck style={{ width: '15px', height: '15px' }} />
                      <span>Schedule Doorstep Pickup &amp; Generate Label</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: Counter Drop-Off Form */}
          {dispatchMode === 'counter' && (
            <form
              onSubmit={handleCounterSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {counterError && (
                <div className="admin-alert-error">
                  <AlertCircle
                    style={{ width: '16px', height: '16px', flexShrink: 0, color: '#F87171' }}
                  />
                  <span>{counterError}</span>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px'
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Counter Courier Partner
                  </label>
                  <select
                    value={courierProvider}
                    onChange={(e) => setCourierProvider(e.target.value as CourierProvider)}
                    className="admin-select"
                  >
                    <option value="dtdc">DTDC Express</option>
                    <option value="india_post">India Post (Speed Post)</option>
                    <option value="delhivery">Delhivery</option>
                    <option value="bluedart">Blue Dart</option>
                    <option value="other">Other / Local Courier</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: '#8BAAA0',
                      marginBottom: '6px'
                    }}
                  >
                    Tracking Number (AWB / Consignment #)
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DTDC12345678 or EM123456789IN"
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#8BAAA0',
                    marginBottom: '6px'
                  }}
                >
                  Counter Dispatch Notes (Optional)
                </label>
                <input
                  type="text"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder="e.g. Handed over at Banjara Hills post office counter"
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="enableWebhookTracker"
                  checked={registerWithTracker}
                  onChange={(e) => setRegisterWithTracker(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#C5A880',
                    cursor: 'pointer'
                  }}
                />
                <label
                  htmlFor="enableWebhookTracker"
                  style={{ fontSize: '0.75rem', color: '#E8ECE9', cursor: 'pointer' }}
                >
                  Enable automated delivery tracking via universal courier webhook adapter
                </label>
              </div>

              <div style={{ paddingTop: '4px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingCounter || !trackingNumber.trim()}
                  className="admin-btn-primary"
                >
                  {isSubmittingCounter ? (
                    <>
                      <Loader2
                        style={{
                          width: '16px',
                          height: '16px',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                      <span>Recording Dispatch...</span>
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '14px', height: '14px' }} />
                      <span>Record Counter Dispatch &amp; Link Tracking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Order State Transition Controls */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontFamily: 'serif',
            color: '#FDFBF7',
            margin: 0
          }}
        >
          Order Lifecycle Status
        </h3>

        {statusError && (
          <div className="admin-alert-error">
            <AlertCircle
              style={{
                width: '16px',
                height: '16px',
                flexShrink: 0,
                color: '#F87171'
              }}
            />
            <span>{statusError}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {orderStatus === 'paid' && (
            <button
              onClick={() => handleStatusTransition('processing')}
              disabled={isUpdatingStatus}
              className="admin-btn-secondary"
            >
              {isUpdatingStatus ? (
                <Loader2
                  style={{
                    width: '14px',
                    height: '14px',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              ) : (
                <Clock style={{ width: '14px', height: '14px', color: '#FBBF24' }} />
              )}
              <span>Move to In-Preparation (Processing)</span>
            </button>
          )}

          {orderStatus === 'processing' && (
            <button
              onClick={() => handleStatusTransition('completed')}
              disabled={isUpdatingStatus}
              className="admin-btn-secondary"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgba(16, 185, 129, 0.4)',
                color: '#34D399'
              }}
            >
              {isUpdatingStatus ? (
                <Loader2
                  style={{
                    width: '14px',
                    height: '14px',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              ) : (
                <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34D399' }} />
              )}
              <span>Mark Order as Delivered &amp; Completed</span>
            </button>
          )}

          {orderStatus === 'completed' && (
            <div
              className="admin-badge admin-badge-emerald"
              style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
            >
              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34D399' }} />
              <span>Order is fulfilled and completed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
