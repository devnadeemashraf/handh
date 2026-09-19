'use client';

import {
  Package,
  Boxes,
  BarChart3,
  Sliders,
  Tag,
  Palette,
  ExternalLink,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

export default function AdminHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <header className="admin-header-bar">
      <div className="admin-header-content">
        {/* Brand & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href="/admin/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#FDFBF7',
              fontFamily: 'serif',
              fontWeight: 600,
              fontSize: '1.125rem',
              textDecoration: 'none'
            }}
          >
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
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid #235847'
              }}
            >
              H&amp;H
            </div>
            <span>Workshop Operations</span>
          </a>
          <span
            className="admin-badge admin-badge-emerald"
            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
          >
            <ShieldCheck style={{ width: '12px', height: '12px', color: '#C5A880' }} />
            Protected Portal
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/admin/orders"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <Package style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Orders</span>
          </a>

          <a
            href="/admin/inventory"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <Boxes style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Inventory</span>
          </a>

          <a
            href="/admin/insights"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <BarChart3 style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Insights</span>
          </a>

          <a
            href="/admin/coupons"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <Tag style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Coupons</span>
          </a>

          <a
            href="/admin/brand"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <Palette style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Brand</span>
          </a>

          <a
            href="/admin/service-control"
            className="admin-btn-secondary"
            style={{ minHeight: '40px', padding: '8px 14px' }}
          >
            <Sliders style={{ width: '16px', height: '16px', color: '#C5A880' }} />
            <span>Services</span>
          </a>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary"
            style={{
              minHeight: '40px',
              padding: '8px 14px',
              backgroundColor: 'transparent',
              color: '#8BAAA0',
              borderColor: '#1C4D3E'
            }}
          >
            <span>Live Store</span>
            <ExternalLink style={{ width: '14px', height: '14px' }} />
          </a>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: '#F87171',
              backgroundColor: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              minHeight: '40px',
              transition: 'background-color 0.2s ease'
            }}
            title="Sign out of admin"
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            <span>{isLoggingOut ? 'Exiting...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
