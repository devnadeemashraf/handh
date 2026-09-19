import { Clock, IndianRupee, ShoppingBag, Truck } from 'lucide-react';

import { createDbClient, getAdminOrderMetrics, listAdminOrders } from '@hh/db';

import OrdersTable from './OrdersTable';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminOrdersPage() {
  const db = getDatabase();

  const [metrics, orders] = await Promise.all([
    getAdminOrderMetrics(db),
    listAdminOrders(db, { limit: 100 })
  ]);

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(metrics.totalRevenueMinor / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontFamily: 'serif',
            color: '#FDFBF7',
            margin: '0 0 4px'
          }}
        >
          Order Queue
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
          Review incoming purchases, dispatch artisanal pieces, and record courier tracking.
        </p>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="admin-kpi-grid">
        {/* Total Captured Revenue */}
        <div className="admin-kpi-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#8BAAA0'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Revenue
            </span>
            <IndianRupee style={{ width: '16px', height: '16px', color: '#C5A880' }} />
          </div>
          <div className="admin-kpi-value">{formattedRevenue}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>Total captured online</div>
        </div>

        {/* To Pack (Urgent) */}
        <div className="admin-kpi-card urgent">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#C5A880'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              To Pack
            </span>
            <Clock style={{ width: '16px', height: '16px', color: '#C5A880' }} />
          </div>
          <div className="admin-kpi-value">{metrics.toPackCount}</div>
          <div style={{ fontSize: '0.6875rem', color: '#A08865' }}>Awaiting courier handover</div>
        </div>

        {/* In Transit */}
        <div className="admin-kpi-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#8BAAA0'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              In Transit
            </span>
            <Truck style={{ width: '16px', height: '16px', color: '#73A796' }} />
          </div>
          <div className="admin-kpi-value">{metrics.shippedCount}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>Dispatched with tracking</div>
        </div>

        {/* Total Orders */}
        <div className="admin-kpi-card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#8BAAA0'
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Total
            </span>
            <ShoppingBag style={{ width: '16px', height: '16px', color: '#8BAAA0' }} />
          </div>
          <div className="admin-kpi-value">{metrics.totalOrdersCount}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>All recorded transactions</div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable initialOrders={orders} />
    </div>
  );
}
