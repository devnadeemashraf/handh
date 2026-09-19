'use client';

import {
  AlertTriangle,
  ArrowRight,
  Flame,
  MessageSquare,
  PackageOpen,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { useState } from 'react';

import { buildVipWhatsAppUrl } from '@hh/domain';

import type { ExecutiveInsightsData, InsightTimeframe } from '@hh/domain';

interface InsightsDashboardProps {
  initialInsights: ExecutiveInsightsData;
}

export default function InsightsDashboard({ initialInsights }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<ExecutiveInsightsData>(initialInsights);
  const [timeframe, setTimeframe] = useState<InsightTimeframe>(initialInsights.timeframe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (selectedTimeframe: InsightTimeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/insights?timeframe=${selectedTimeframe}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh executive insights.');
      }
      setInsights(data.insights);
      setTimeframe(selectedTimeframe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading insights.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  };

  const sales = insights.sales;
  const customers = insights.customers;
  const productVelocity = insights.productVelocity;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Timeframe Filter Switcher */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontFamily: 'serif',
                fontWeight: 600,
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Executive Insights &amp; Intelligence
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Real-time trajectory of gross revenue, customer repeat loyalty, and product velocity.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeframe selector pills */}
          <div className="admin-tabs-bar" role="tablist">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={timeframe === tab.id}
                disabled={isLoading}
                onClick={() => fetchInsights(tab.id)}
                className={`admin-tab-btn ${timeframe === tab.id ? 'active' : ''}`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchInsights(timeframe)}
            disabled={isLoading}
            className="admin-btn-secondary"
            style={{ minHeight: '38px', padding: '8px 12px' }}
            title="Refresh metrics"
          >
            <RefreshCw
              style={{
                width: '14px',
                height: '14px',
                color: '#C5A880',
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert-error">
          <AlertTriangle
            style={{ width: '16px', height: '16px', flexShrink: 0, color: '#F87171' }}
          />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Sales & Volume KPI Scoreboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {/* KPI 1: Gross Revenue */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8BAAA0',
                fontWeight: 600
              }}
            >
              Gross Revenue
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(197, 168, 128, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            </div>
          </div>
          <div
            data-testid="kpi-gross-revenue"
            style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FDFBF7', fontFamily: 'serif' }}
          >
            {formatPrice(sales.revenueMinor)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>
            Captured payments in {timeframe === 'all' ? 'total' : timeframe}
          </div>
        </div>

        {/* KPI 2: Paid Orders */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8BAAA0',
                fontWeight: 600
              }}
            >
              Paid Orders
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingBag style={{ width: '16px', height: '16px', color: '#34D399' }} />
            </div>
          </div>
          <div
            data-testid="kpi-paid-orders"
            style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FDFBF7' }}
          >
            {sales.orderCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#34D399' }}>Successfully processed orders</div>
        </div>

        {/* KPI 3: Average Order Value (AOV) */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8BAAA0',
                fontWeight: 600
              }}
            >
              Average Order Value
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Receipt style={{ width: '16px', height: '16px', color: '#60A5FA' }} />
            </div>
          </div>
          <div
            data-testid="kpi-aov"
            style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FDFBF7', fontFamily: 'serif' }}
          >
            {formatPrice(sales.aovMinor)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>Average patron cart spend</div>
        </div>

        {/* KPI 4: Pending Packaging */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8BAAA0',
                fontWeight: 600
              }}
            >
              Pending Packaging
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PackageOpen style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
            </div>
          </div>
          <div
            data-testid="kpi-pending-fulfillment"
            style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FDFBF7' }}
          >
            {sales.pendingFulfillmentCount}
          </div>
          <a
            href="/admin/orders"
            style={{
              fontSize: '0.75rem',
              color: '#C5A880',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none'
            }}
          >
            <span>Fulfill orders</span>
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </a>
        </div>
      </div>

      {/* SECTION 2: Customer Frequency & Loyalty Intelligence */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Left: Customer Retention Rate Card */}
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
              <Users style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontFamily: 'serif', color: '#FDFBF7', margin: 0 }}>
                Patron Retention &amp; Frequency
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                Customer repeat loyalty across paid orders
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#0F2D24',
              borderRadius: '12px',
              border: '1px solid #1C4D3E',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <span style={{ fontSize: '0.8125rem', color: '#8BAAA0' }}>Repeat Patron Rate</span>
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#34D399',
                  fontFamily: 'monospace'
                }}
              >
                {customers.repeatRatePercentage}%
              </span>
            </div>

            {/* Visual Retention Progress Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#0A241C',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(0, customers.repeatRatePercentage))}%`,
                  height: '100%',
                  backgroundColor: '#34D399',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #1C4D3E',
                fontSize: '0.75rem',
                color: '#8BAAA0'
              }}
            >
              <div>
                Total Patrons:{' '}
                <strong style={{ color: '#FDFBF7' }}>{customers.totalCustomers}</strong>
              </div>
              <div>
                Repeat Patrons:{' '}
                <strong style={{ color: '#34D399' }}>{customers.repeatCustomers}</strong>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: 0, lineHeight: 1.5 }}>
            Patrons who place 2 or more orders represent your highest-LTV audience. Use the 1-click
            VIP Concierge button below to reach out directly via WhatsApp with tailored styling
            recommendations or early drop access.
          </p>
        </div>

        {/* Right: Top Customer Frequency Leaderboard */}
        <div
          className="admin-card"
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1rem', fontFamily: 'serif', color: '#FDFBF7', margin: 0 }}>
              Top Patrons by Lifetime Value
            </h3>
            <span className="admin-badge admin-badge-gold">
              Top {customers.topCustomers.length} Patrons
            </span>
          </div>

          {customers.topCustomers.length === 0 ? (
            <div
              style={{
                padding: '32px',
                textAlign: 'center',
                color: '#8BAAA0',
                fontSize: '0.8125rem'
              }}
            >
              No customer orders captured yet for this timeframe.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customers.topCustomers.map((patron, idx) => {
                const waUrl = buildVipWhatsAppUrl(
                  patron.customerPhone,
                  patron.customerName,
                  'H&H Atelier'
                );

                return (
                  <div
                    key={patron.customerEmail}
                    className="admin-card-inner"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: idx === 0 ? '#C5A880' : '#164335',
                          color: idx === 0 ? '#0A2E24' : '#FDFBF7',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        #{idx + 1}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: '#FDFBF7', fontSize: '0.875rem' }}>
                            {patron.customerName}
                          </span>
                          {patron.isRepeatCustomer && (
                            <span
                              className="admin-badge admin-badge-emerald"
                              style={{ fontSize: '0.625rem', padding: '2px 6px' }}
                            >
                              Repeat VIP
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>
                          {patron.customerEmail} &bull; {patron.customerPhone}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#FDFBF7', fontSize: '0.875rem' }}>
                          {formatPrice(patron.totalSpendMinor)}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#8BAAA0' }}>
                          {patron.orderCount} {patron.orderCount === 1 ? 'order' : 'orders'} &bull;
                          Last: {formatDate(patron.lastOrderAt)}
                        </div>
                      </div>

                      {patron.customerPhone && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn-wa"
                          style={{ minHeight: '34px', padding: '6px 10px', fontSize: '0.75rem' }}
                          title="Open WhatsApp VIP Concierge greeting"
                        >
                          <MessageSquare style={{ width: '13px', height: '13px' }} />
                          <span>VIP Concierge</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Product Sales Velocity Leaderboard */}
      <div className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <Flame style={{ width: '16px', height: '16px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontFamily: 'serif', color: '#FDFBF7', margin: 0 }}>
                Product Sales Velocity &amp; Stock Burn
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#8BAAA0', margin: '2px 0 0' }}>
                Artisanal pieces ranked by units sold and revenue during this timeframe
              </p>
            </div>
          </div>

          <a
            href="/admin/inventory"
            className="admin-btn-secondary"
            style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <span>Manage Workshop Inventory</span>
            <ArrowRight style={{ width: '12px', height: '12px' }} />
          </a>
        </div>

        {productVelocity.length === 0 ? (
          <div
            style={{
              padding: '32px',
              textAlign: 'center',
              color: '#8BAAA0',
              fontSize: '0.8125rem'
            }}
          >
            No sales recorded yet for products in this timeframe.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.8125rem'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid #1C4D3E', color: '#8BAAA0' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>Rank</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>
                    Artisanal Piece &amp; Variant
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'center' }}>
                    Units Sold
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>
                    Revenue (₹)
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 600, textAlign: 'right' }}>
                    Atelier Stock
                  </th>
                </tr>
              </thead>
              <tbody>
                {productVelocity.map((item, index) => (
                  <tr
                    key={item.sku}
                    style={{
                      borderBottom: '1px solid #164335',
                      color: '#FDFBF7'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <span
                        className="admin-badge admin-badge-gold"
                        style={{ fontFamily: 'monospace', fontWeight: 700 }}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{item.productTitle}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>
                        {item.variantTitle}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#8BAAA0' }}>
                      {item.sku}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                      {item.unitsSold}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'serif',
                        color: '#C5A880'
                      }}
                    >
                      {formatPrice(item.revenueMinor)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {item.currentStock === 0 ? (
                        <span className="admin-badge admin-badge-rose">Sold Out</span>
                      ) : item.currentStock <= 3 ? (
                        <span className="admin-badge admin-badge-amber">
                          {item.currentStock} left (Low)
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-emerald">
                          {item.currentStock} in stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
