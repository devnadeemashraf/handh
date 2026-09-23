import { ArrowLeft, CheckCircle2, ExternalLink, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import React from 'react';

import { findOrderByOrderNumber, getSharedDbClient } from '@hh/db';
import { formatIndianPhoneDisplay, Money } from '@hh/domain';

import { getAdminSession } from '../../../lib/admin-auth';
import { getCurrentUser } from '../../../lib/auth';
import { verifyOrderReceiptToken } from '../../../lib/receipt-token';

interface SuccessPageProps {
  searchParams: Promise<{ orderNumber?: string; token?: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { orderNumber, token } = await searchParams;

  if (!orderNumber) {
    notFound();
    return null;
  }

  const db = getDatabase();
  const order = await findOrderByOrderNumber(db, orderNumber);

  if (!order) {
    notFound();
    return null;
  }

  // Authorization & PII Protection Check (E-COM-143)
  const currentUser = await getCurrentUser();
  const isOwner = Boolean(currentUser && order.userId && currentUser.id === order.userId);
  const adminSession = !isOwner ? await getAdminSession() : null;
  const isAdmin = Boolean(adminSession);
  const isTokenValid = Boolean(
    token && verifyOrderReceiptToken(token, order.id, order.orderNumber)
  );

  if (!isOwner && !isAdmin && !isTokenValid) {
    notFound();
    return null;
  }

  const isPaid = order.status === 'paid' || order.paymentStatus === 'captured';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main className="royale-container" style={{ flex: 1, padding: '48px 16px 96px' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: '40px 28px'
          }}
        >
          {/* Header Status */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: isPaid ? 'rgba(10, 46, 36, 0.08)' : '#FFFBEB',
                color: isPaid ? 'var(--color-primary-emerald)' : '#D97706',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <CheckCircle2 size={40} />
            </div>

            <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
              {isPaid ? 'Payment Confirmed' : 'Order Placed'}
            </span>

            <h1 className="royale-heading" style={{ fontSize: '2rem', margin: '0 0 8px' }}>
              {isPaid ? 'Thank You for Your Order' : 'Order Processing'}
            </h1>

            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', margin: 0 }}>
              A confirmation email has been dispatched to <strong>{order.customerEmail}</strong>.
            </p>
          </div>

          {/* Order Details Badge */}
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Order Reference Number
              </span>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-primary-emerald)',
                  letterSpacing: '0.05em',
                  marginTop: '2px'
                }}
              >
                {order.orderNumber}
              </div>
            </div>

            <span
              className={`royale-badge ${isPaid ? 'royale-badge-emerald' : 'royale-badge-gold'}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {isPaid ? 'Payment Captured' : 'Awaiting Payment'}
            </span>
          </div>

          {/* Itemized Order Snapshot */}
          <div style={{ marginBottom: '32px' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '10px',
                marginBottom: '16px'
              }}
            >
              Handcrafted Items ({order.items.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {order.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    fontSize: '0.9rem',
                    paddingBottom: '12px',
                    borderBottom: '1px dashed var(--color-border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {item.productNameSnapshot}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {item.variantNameSnapshot} · Qty: {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {Money.fromMinor(item.totalPriceMinor, 'INR').format()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px 20px',
              marginBottom: '32px',
              fontSize: '0.9rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: 'var(--color-text-muted)'
              }}
            >
              <span>Subtotal</span>
              <span>{Money.fromMinor(order.subtotalMinor, 'INR').format()}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                color: 'var(--color-text-muted)'
              }}
            >
              <span>Courier Delivery</span>
              <span>
                {order.shippingMinor === 0
                  ? 'FREE'
                  : Money.fromMinor(order.shippingMinor, 'INR').format()}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--color-primary-emerald)',
                paddingTop: '8px',
                borderTop: '1px solid var(--color-border)'
              }}
            >
              <span>Total Paid</span>
              <span>{Money.fromMinor(order.totalMinor, 'INR').format()}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '10px',
                marginBottom: '12px'
              }}
            >
              Delivery Destination
            </h2>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text)',
                lineHeight: 1.6
              }}
            >
              <div>{order.customerName}</div>
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 && <div>{order.shippingAddress.line2}</div>}
              <div>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode}
              </div>
              <div>Contact: {formatIndianPhoneDisplay(order.customerPhone)}</div>
            </div>
          </div>

          {/* Reassurance Banner */}
          <div
            style={{
              backgroundColor: 'rgba(10, 46, 36, 0.04)',
              border: '1px solid rgba(10, 46, 36, 0.1)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px',
              fontSize: '0.85rem',
              color: 'var(--color-primary-emerald)'
            }}
          >
            <Package size={22} style={{ flexShrink: 0 }} />
            <span>
              Your piece is safely reserved in stock and will be carefully handcrafted, inspected,
              and dispatched from our Hyderabad atelier.
            </span>
          </div>

          {/* Direct Real-Time Tracking Section */}
          <div
            style={{
              backgroundColor: 'rgba(197, 168, 128, 0.08)',
              border: '1px solid rgba(197, 168, 128, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px 20px',
              textAlign: 'center',
              marginBottom: '32px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}
            >
              <Truck size={20} style={{ color: 'var(--color-accent-gold)' }} />
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-primary-emerald)'
                }}
              >
                Real-Time Order Tracking
              </h3>
            </div>

            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                margin: '0 0 16px',
                maxWidth: '460px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              Follow your handcrafted parcel live through workshop preparation, quality inspection,
              and courier handover.
            </p>

            <Link
              href={`/track/${order.orderNumber}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                backgroundColor: 'var(--color-primary-emerald)',
                color: '#ffffff',
                border: '1px solid var(--color-primary-emerald)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
                borderRadius: 'var(--radius-sm)',
                transition: 'opacity 0.2s ease'
              }}
            >
              <Truck size={16} />
              <span>Track Order Live</span>
              <ExternalLink size={14} />
            </Link>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                color: 'var(--color-text-muted)',
                textDecoration: 'none',
                fontSize: '0.9rem'
              }}
            >
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
