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
  Send
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

  // Address copy state
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  // Fulfillment form state
  const [courierProvider, setCourierProvider] = useState<CourierProvider>('dtdc');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null);

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

  // Submit manual courier fulfillment
  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsSubmitting(true);
    setFulfillmentError(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierProvider,
          trackingNumber: trackingNumber.trim(),
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFulfillmentError(data.error || 'Failed to record fulfillment.');
        setIsSubmitting(false);
        return;
      }

      // Append fulfillment & update status locally
      setFulfillments((prev) => [data.fulfillment, ...prev]);
      setFulfillmentStatus('shipped');
      if (orderStatus === 'paid') {
        setOrderStatus('processing');
      }

      setTrackingNumber('');
      setNotes('');
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setFulfillmentError('A network error occurred while recording fulfillment.');
      setIsSubmitting(false);
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

  const cleanPhone = order.customerPhone.replace(/\D/g, '');
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
                Shipment &amp; Courier Tracking
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                {fulfillments.length === 0
                  ? 'Parcel has not yet been assigned a courier tracking number.'
                  : `${fulfillments.length} courier dispatch recorded.`}
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

        {/* Existing Fulfillments List */}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: '#FDFBF7'
                          }}
                        >
                          {COURIER_LABELS[fulf.courierProvider]}
                        </span>
                        <span
                          className="admin-badge admin-badge-gold"
                          style={{ fontFamily: 'monospace' }}
                        >
                          AWB: {fulf.trackingNumber}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: '#8BAAA0',
                          margin: 0
                        }}
                      >
                        Ref: {fulf.trackingReference}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

        {/* Manual Fulfillment Entry Form */}
        <form
          onSubmit={handleFulfillSubmit}
          style={{
            borderTop: '1px solid #1C4D3E',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <h4
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#A0C0B5',
              fontWeight: 600,
              margin: 0
            }}
          >
            {fulfillments.length === 0 ? 'Dispatch Shipment' : 'Add Additional Tracking'}
          </h4>

          {fulfillmentError && (
            <div className="admin-alert-error">
              <AlertCircle
                style={{
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                  color: '#F87171'
                }}
              />
              <span>{fulfillmentError}</span>
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
                Courier Provider
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
              Dispatch Notes (Internal / Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handed over at Hyderabad Jubilee Hills branch"
              className="admin-input"
            />
          </div>

          <div style={{ paddingTop: '4px' }}>
            <button
              type="submit"
              disabled={isSubmitting || !trackingNumber.trim()}
              className="admin-btn-primary"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    style={{
                      width: '16px',
                      height: '16px',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <span>Recording Shipment...</span>
                </>
              ) : (
                <>
                  <Send style={{ width: '14px', height: '14px' }} />
                  <span>Mark as Dispatched &amp; Generate Tracking Link</span>
                </>
              )}
            </button>
          </div>
        </form>
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
