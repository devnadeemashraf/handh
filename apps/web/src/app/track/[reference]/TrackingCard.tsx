'use client';

import { useState } from 'react';
import {
  Truck,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  PackageCheck,
  CheckCircle2
} from 'lucide-react';
import { COURIER_LABELS, resolveCourierTrackingUrl, type CourierProvider } from '@hh/domain';
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
      <div className="track-box" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#164335',
              color: '#C5A880',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              border: '1px solid #235847',
              fontSize: '1rem',
              fontFamily: 'serif'
            }}
          >
            H&amp;H
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontFamily: 'serif',
              color: '#FDFBF7',
              margin: '0 0 6px'
            }}
          >
            Order Live Status
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Order Reference:{' '}
            <span style={{ fontFamily: 'monospace', color: '#C5A880', fontWeight: 600 }}>
              {order.orderNumber}
            </span>
          </p>
        </div>

        {/* Status Card */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px' }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: '#164335',
                  color: '#C5A880',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #235847'
                }}
              >
                <Sparkles style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
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
                  Live Progress
                </p>
                <h2
                  style={{
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    color: '#FDFBF7',
                    margin: '2px 0 0'
                  }}
                >
                  Workshop Preparation &amp; Packing
                </h2>
              </div>
            </div>

            <span className="admin-badge admin-badge-amber" style={{ padding: '6px 12px' }}>
              <Clock style={{ width: '14px', height: '14px' }} />
              Order Confirmed
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="track-step-list">
            {/* Step 1: Order Confirmed */}
            <div className="track-step-item">
              <div className="track-step-icon done">
                <PackageCheck style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ paddingTop: '6px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
                  Order Confirmed &amp; Payment Captured
                </p>
                <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                  Transaction verified on {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Step 2: Workshop Preparation (Active) */}
            <div className="track-step-item">
              <div className="track-step-icon active">
                <Sparkles style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ paddingTop: '6px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#C5A880', margin: 0 }}>
                  Artisanal Quality Inspection &amp; Packing
                </p>
                <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                  Hand-crafted pieces are being individually examined and packed into bespoke
                  H&amp;H gift boxes.
                </p>
              </div>
            </div>

            {/* Step 3: Courier Handover (Pending) */}
            <div className="track-step-item">
              <div className="track-step-icon pending">
                <Truck style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ paddingTop: '6px' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#53766A', margin: 0 }}>
                  Courier Handover &amp; Live Tracking
                </p>
                <p style={{ fontSize: '0.75rem', color: '#53766A', margin: '2px 0 0' }}>
                  Consignment will be handed to DTDC / India Post / Delhivery with instant AWB
                  tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Destination & Info Card */}
          <div
            className="admin-card-inner"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E8ECE9' }}>
              <MapPin style={{ width: '16px', height: '16px', color: '#C5A880', flexShrink: 0 }} />
              <span>
                Shipping to: <strong>{order.customerName}</strong> — {shippingAddr.city},{' '}
                {shippingAddr.state} ({shippingAddr.postalCode})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8BAAA0' }}>
              <Calendar
                style={{ width: '16px', height: '16px', color: '#C5A880', flexShrink: 0 }}
              />
              <span>Dispatches within 24-48 business hours from our Hyderabad atelier.</span>
            </div>
          </div>

          {/* Workshop Notice */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'rgba(22, 67, 53, 0.4)',
              border: '1px solid #1C4D3E',
              fontSize: '0.75rem',
              color: '#8BAAA0',
              lineHeight: 1.6
            }}
          >
            <strong style={{ color: '#FDFBF7' }}>Live Tracking Note:</strong> As soon as your parcel
            is collected by the courier, your live Air Waybill (AWB) consignment number and official
            tracking portal link will update on this page automatically.
          </div>
        </div>

        {/* Concierge Support Footer */}
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8BAAA0' }}>
          <p style={{ margin: '0 0 6px' }}>Have questions about your order or customization?</p>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#C5A880',
              textDecoration: 'none',
              fontWeight: 500
            }}
          >
            <MessageCircle style={{ width: '14px', height: '14px' }} />
            <span>Chat with H&amp;H Concierge on WhatsApp</span>
          </a>
        </div>
      </div>
    );
  }

  // Case 2: Parcel has been dispatched with Courier Tracking
  return (
    <div className="track-box" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#164335',
            color: '#C5A880',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            border: '1px solid #235847',
            fontSize: '1rem',
            fontFamily: 'serif'
          }}
        >
          H&amp;H
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontFamily: 'serif',
            color: '#FDFBF7',
            margin: '0 0 6px'
          }}
        >
          Shipment Progress
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
          Consignment Reference:{' '}
          <span style={{ fontFamily: 'monospace', color: '#C5A880', fontWeight: 600 }}>
            {fulfillment.trackingReference}
          </span>
        </p>
      </div>

      {/* Main Status Card */}
      <div
        className="admin-card"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '28px' }}
      >
        {/* Status Badge & Animation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1C4D3E',
            paddingBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#164335',
                color: '#C5A880',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #235847'
              }}
            >
              <Truck style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
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
                Status
              </p>
              <h2
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: '#FDFBF7',
                  margin: '2px 0 0'
                }}
              >
                {fulfillment.status === 'shipped' ? 'Handed to Courier (In Transit)' : 'Delivered'}
              </h2>
            </div>
          </div>

          <span className="admin-badge admin-badge-emerald" style={{ padding: '6px 12px' }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            Verified Dispatch
          </span>
        </div>

        {/* Live 4-Stage Stepper */}
        <div className="track-step-list">
          {/* Step 1: Confirmed */}
          <div className="track-step-item">
            <div className="track-step-icon done">
              <PackageCheck style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{ paddingTop: '6px' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
                Order Confirmed &amp; Payment Captured
              </p>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                Payment verified on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Step 2: Packed */}
          <div className="track-step-item">
            <div className="track-step-icon done">
              <Sparkles style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{ paddingTop: '6px' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
                Handcrafted &amp; Packed at Hyderabad Atelier
              </p>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
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
              <Truck style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{ paddingTop: '6px' }}>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: fulfillment.status === 'delivered' ? '#FDFBF7' : '#C5A880',
                  margin: 0
                }}
              >
                {fulfillment.status === 'delivered'
                  ? 'Courier Transit Completed'
                  : 'In Transit with Courier Partner'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
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
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{ paddingTop: '6px' }}>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: fulfillment.status === 'delivered' ? '#34D399' : '#53766A',
                  margin: 0
                }}
              >
                {fulfillment.status === 'delivered'
                  ? 'Delivered to Customer'
                  : 'Final Delivery to Destination'}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: fulfillment.status === 'delivered' ? '#8BAAA0' : '#53766A',
                  margin: '2px 0 0'
                }}
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
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(22, 67, 53, 0.6)',
              border: '1px solid #235847',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: fulfillment.status === 'delivered' ? '#34D399' : '#C5A880',
                boxShadow:
                  fulfillment.status === 'delivered'
                    ? '0 0 8px rgba(52, 211, 153, 0.8)'
                    : '0 0 8px rgba(197, 168, 128, 0.8)',
                flexShrink: 0
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#8BAAA0',
                  fontWeight: 600
                }}
              >
                Latest Courier Scan Update
              </span>
              <span style={{ fontSize: '0.875rem', color: '#FDFBF7', fontWeight: 500 }}>
                {fulfillment.latestEvent}
              </span>
            </div>
          </div>
        )}

        {/* Courier Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          <div
            className="admin-card-inner"
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <span style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>Courier Partner</span>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FDFBF7', margin: 0 }}>
              {COURIER_LABELS[fulfillment.courierProvider as CourierProvider] ||
                fulfillment.courierProvider}
            </p>
          </div>

          <div
            className="admin-card-inner"
            style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>Consignment / AWB #</span>
              <button
                onClick={copyAwb}
                style={{
                  color: '#C5A880',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.6875rem'
                }}
                title="Copy tracking number"
              >
                {hasCopiedAwb ? (
                  <Check style={{ width: '12px', height: '12px', color: '#34D399' }} />
                ) : (
                  <Copy style={{ width: '12px', height: '12px' }} />
                )}
                <span>{hasCopiedAwb ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p
              style={{
                fontSize: '0.9375rem',
                fontFamily: 'monospace',
                fontWeight: 700,
                color: '#C5A880',
                margin: 0
              }}
            >
              {fulfillment.trackingNumber}
            </p>
          </div>
        </div>

        {/* Timeline & Destination */}
        <div
          className="admin-card-inner"
          style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E8ECE9' }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#C5A880', flexShrink: 0 }} />
            <span>Dispatched from Hyderabad workshop on {formatDate(fulfillment.shippedAt)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#E8ECE9',
              borderTop: '1px solid rgba(28, 77, 62, 0.6)',
              paddingTop: '10px'
            }}
          >
            <MapPin style={{ width: '16px', height: '16px', color: '#C5A880', flexShrink: 0 }} />
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
            className="admin-btn-primary"
            style={{
              width: '100%',
              minHeight: '48px',
              fontSize: '0.9375rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            <span>Track on Official Courier Website</span>
            <ExternalLink style={{ width: '16px', height: '16px' }} />
          </a>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(22, 67, 53, 0.4)',
              fontSize: '0.75rem',
              color: '#8BAAA0'
            }}
          >
            Please use your AWB number on the courier partner&apos;s mobile app or local counter.
          </div>
        )}
      </div>

      {/* Concierge Support Footer */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#8BAAA0' }}>
        <p style={{ margin: '0 0 6px' }}>Questions regarding your delivery schedule?</p>
        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#C5A880',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          <MessageCircle style={{ width: '14px', height: '14px' }} />
          <span>Chat with H&amp;H Concierge on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
