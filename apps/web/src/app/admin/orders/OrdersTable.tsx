'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronRight, Package, Truck, CheckCircle2, Clock, X } from 'lucide-react';
import type { Order } from '@hh/db';

interface OrdersTableProps {
  initialOrders: Array<Order & { itemCount: number }>;
}

type TabKey = 'all' | 'to_pack' | 'processing' | 'shipped';

export default function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      // 1. Tab Filter
      if (activeTab === 'to_pack') {
        if (order.status !== 'paid' || order.fulfillmentStatus === 'shipped') return false;
      } else if (activeTab === 'processing') {
        if (order.status !== 'processing') return false;
      } else if (activeTab === 'shipped') {
        if (order.fulfillmentStatus !== 'shipped') return false;
      }

      // 2. Search Filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.toLowerCase().includes(q);
        const matchesEmail = order.customerEmail.toLowerCase().includes(q);
        return matchesNumber || matchesName || matchesPhone || matchesEmail;
      }

      return true;
    });
  }, [initialOrders, activeTab, searchQuery]);

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
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Tabs Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Status Filter Tabs */}
        <div className="admin-tabs-bar">
          <button
            onClick={() => setActiveTab('all')}
            className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            All Orders ({initialOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('to_pack')}
            className={`admin-tab-btn urgent ${activeTab === 'to_pack' ? 'active' : ''}`}
          >
            <Clock style={{ width: '14px', height: '14px' }} />
            <span>To Pack</span>
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={`admin-tab-btn ${activeTab === 'processing' ? 'active' : ''}`}
          >
            Processing
          </button>
          <button
            onClick={() => setActiveTab('shipped')}
            className={`admin-tab-btn ${activeTab === 'shipped' ? 'active' : ''}`}
          >
            <Truck style={{ width: '14px', height: '14px' }} />
            <span>In Transit</span>
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '320px', minWidth: '220px' }}>
          <Search
            style={{
              width: '16px',
              height: '16px',
              color: '#608578',
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, phone, name..."
            className="admin-input"
            style={{
              paddingLeft: '38px',
              paddingRight: searchQuery ? '36px' : '12px',
              height: '40px',
              minHeight: '40px',
              fontSize: '0.8125rem'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#8BAAA0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Package
            style={{
              width: '40px',
              height: '40px',
              color: '#396253',
              margin: '0 auto 12px',
              display: 'block'
            }}
          />
          <h3
            style={{
              fontSize: '1rem',
              fontFamily: 'serif',
              color: '#FDFBF7',
              margin: '0 0 6px'
            }}
          >
            No orders in this queue
          </h3>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#8BAAA0',
              margin: '0 auto',
              maxWidth: '380px'
            }}
          >
            {searchQuery
              ? `No orders matching "${searchQuery}". Try searching with a different keyword.`
              : 'Orders placed and paid by customers will appear here automatically.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => (
            <a key={order.id} href={`/admin/orders/${order.id}`} className="admin-order-card">
              {/* Left: Order identity & customer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#C5A880',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {order.orderNumber}
                  </span>

                  {/* Status Badge */}
                  {order.status === 'paid' && order.fulfillmentStatus === 'unfulfilled' && (
                    <span className="admin-badge admin-badge-amber">
                      <Clock style={{ width: '12px', height: '12px' }} />
                      Ready to Pack
                    </span>
                  )}

                  {order.fulfillmentStatus === 'shipped' && (
                    <span className="admin-badge admin-badge-sky">
                      <Truck style={{ width: '12px', height: '12px' }} />
                      Shipped
                    </span>
                  )}

                  {order.status === 'completed' && (
                    <span className="admin-badge admin-badge-emerald">
                      <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                      Completed
                    </span>
                  )}

                  <span style={{ fontSize: '0.75rem', color: '#7B9B90' }}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8125rem',
                    color: '#E8ECE9'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#FDFBF7' }}>{order.customerName}</span>
                  <span style={{ color: '#4E7265' }}>•</span>
                  <span style={{ fontFamily: 'monospace', color: '#A0C0B5' }}>
                    {order.customerPhone}
                  </span>
                </div>
              </div>

              {/* Right: Items, Price & Chevron */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      color: '#FDFBF7'
                    }}
                  >
                    {formatPrice(order.totalMinor)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#7B9B90' }}>
                    {order.itemCount} {order.itemCount === 1 ? 'piece' : 'pieces'}
                  </div>
                </div>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#164335',
                    color: '#C5A880',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
