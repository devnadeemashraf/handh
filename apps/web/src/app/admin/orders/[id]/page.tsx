import { notFound } from 'next/navigation';
import {
  createDbClient,
  findOrderById,
  findFulfillmentsForOrder,
  type ShippingAddress
} from '@hh/db';
import OrderFulfillmentActions from './OrderFulfillmentActions';
import { ChevronLeft, CreditCard, MapPin, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDatabase();

  const [order, fulfillments] = await Promise.all([
    findOrderById(db, params.id),
    findFulfillmentsForOrder(db, params.id)
  ]);

  if (!order) {
    notFound();
  }

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const formatDate = (isoString: string | Date) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const typedShippingAddress = order.shippingAddress as ShippingAddress;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Back Link & Identity */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <a
            href="/admin/orders"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.8125rem',
              color: '#8BAAA0',
              textDecoration: 'none',
              marginBottom: '4px',
              minHeight: '36px'
            }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
            <span>Back to Orders</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontFamily: 'serif',
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Order {order.orderNumber}
            </h1>
            <span
              className="admin-badge admin-badge-gold"
              style={{ fontFamily: 'monospace', fontSize: '0.75rem', padding: '4px 10px' }}
            >
              {order.status.toUpperCase()}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: 0 }}>
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div>
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#8BAAA0',
              display: 'block'
            }}
          >
            Total Value
          </span>
          <p
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#FDFBF7',
              margin: 0
            }}
          >
            {formatPrice(order.totalMinor)}
          </p>
        </div>
      </div>

      {/* Main Grid: Actions, Fulfillment & Order Items */}
      <div className="admin-detail-grid">
        {/* Left Col: Fulfillment Actions & Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <OrderFulfillmentActions
            order={{
              ...order,
              shippingAddress: typedShippingAddress
            }}
            initialFulfillments={fulfillments}
          />

          {/* Ordered Line Items Card */}
          <div
            className="admin-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
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
                <Package style={{ width: '16px', height: '16px' }} />
              </div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontFamily: 'serif',
                  color: '#FDFBF7',
                  margin: 0
                }}
              >
                Purchased Pieces ({order.items.length})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {order.items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '14px 0',
                    borderTop: idx > 0 ? '1px solid #1C4D3E' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#FDFBF7',
                        margin: 0
                      }}
                    >
                      {item.productNameSnapshot}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: 0 }}>
                      Variant: <span style={{ color: '#C5A880' }}>{item.variantNameSnapshot}</span>
                    </p>
                    <p
                      style={{
                        fontSize: '0.6875rem',
                        fontFamily: 'monospace',
                        color: '#608578',
                        margin: 0
                      }}
                    >
                      SKU: {item.skuSnapshot}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#FDFBF7',
                        margin: 0
                      }}
                    >
                      {formatPrice(item.totalPriceMinor)}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: 0 }}>
                      {formatPrice(item.unitPriceMinor)} × {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Shipping & Payment Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Shipping Destination Card */}
          <div
            className="admin-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880' }}>
              <MapPin style={{ width: '16px', height: '16px' }} />
              <h3
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  margin: 0
                }}
              >
                Delivery Address
              </h3>
            </div>

            <div
              className="admin-card-inner"
              style={{
                fontSize: '0.8125rem',
                color: '#E8ECE9',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <p style={{ fontWeight: 600, color: '#FDFBF7', margin: 0 }}>{order.customerName}</p>
              <p style={{ margin: 0 }}>{typedShippingAddress.line1}</p>
              {typedShippingAddress.line2 && (
                <p style={{ margin: 0 }}>{typedShippingAddress.line2}</p>
              )}
              <p style={{ margin: 0 }}>
                {typedShippingAddress.city}, {typedShippingAddress.state} -{' '}
                <span style={{ fontFamily: 'monospace' }}>{typedShippingAddress.postalCode}</span>
              </p>
              <p style={{ color: '#8BAAA0', margin: 0 }}>
                {typedShippingAddress.country || 'India'}
              </p>
              <p
                style={{
                  paddingTop: '8px',
                  color: '#A0C0B5',
                  fontFamily: 'monospace',
                  margin: 0
                }}
              >
                Phone: {order.customerPhone}
              </p>
            </div>
          </div>

          {/* Payment Financial Trace Card */}
          <div
            className="admin-card"
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5A880' }}>
              <CreditCard style={{ width: '16px', height: '16px' }} />
              <h3
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                  margin: 0
                }}
              >
                Financial Breakdown
              </h3>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.8125rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8BAAA0' }}>
                <span>Subtotal</span>
                <span style={{ color: '#FDFBF7', fontFamily: 'monospace' }}>
                  {formatPrice(order.subtotalMinor)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8BAAA0' }}>
                <span>Shipping Tier</span>
                <span style={{ color: '#FDFBF7', fontFamily: 'monospace' }}>
                  {order.shippingMinor === 0 ? 'Free' : formatPrice(order.shippingMinor)}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#FDFBF7',
                  fontWeight: 600,
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(28, 77, 62, 0.6)',
                  fontSize: '0.9375rem'
                }}
              >
                <span>Grand Total</span>
                <span style={{ color: '#C5A880', fontFamily: 'monospace' }}>
                  {formatPrice(order.totalMinor)}
                </span>
              </div>
            </div>

            <div
              style={{
                paddingTop: '10px',
                borderTop: '1px solid #1C4D3E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#8BAAA0'
              }}
            >
              <span>Payment Status:</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: '#34D399',
                  fontWeight: 600
                }}
              >
                {order.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
