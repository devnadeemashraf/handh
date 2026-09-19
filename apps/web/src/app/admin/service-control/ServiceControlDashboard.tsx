'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Power,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  RefreshCw,
  Eye
} from 'lucide-react';
import type { ServiceControlConfig, StoreOperatingStatus } from '@hh/domain';

interface ServiceControlDashboardProps {
  initialConfig: ServiceControlConfig;
}

const PRESET_NOTICES = [
  {
    title: 'Payment Gateway Upgrade',
    headline: 'Payment Gateway Upgrade in Progress',
    text: 'Our payment partner is undergoing brief infrastructure enhancements. Browse freely—checkout & payment will resume shortly!'
  },
  {
    title: 'Scheduled Workshop Upgrade',
    headline: 'Checkout & Payments Temporarily Paused',
    text: 'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'
  },
  {
    title: 'Inventory Reconciliation',
    headline: 'Artisanal Inventory Audit in Progress',
    text: 'Our workshop inventory is undergoing real-time synchronization. Your bag is saved—order processing will be back online in moments.'
  }
];

export default function ServiceControlDashboard({ initialConfig }: ServiceControlDashboardProps) {
  const [operatingStatus, setOperatingStatus] = useState<StoreOperatingStatus>(
    initialConfig.operatingStatus
  );
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean>(initialConfig.checkoutEnabled);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(initialConfig.paymentsEnabled);
  const [headline, setHeadline] = useState<string>(
    initialConfig.headline || 'Checkout & Payments Temporarily Paused'
  );
  const [maintenanceNotice, setMaintenanceNotice] = useState<string>(
    initialConfig.maintenanceNotice
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isFullyActive = operatingStatus === 'active' && checkoutEnabled && paymentsEnabled;

  const handleEmergencyPause = () => {
    setOperatingStatus('maintenance');
    setCheckoutEnabled(false);
    setPaymentsEnabled(false);
  };

  const handleRestoreLive = () => {
    setOperatingStatus('active');
    setCheckoutEnabled(true);
    setPaymentsEnabled(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: ServiceControlConfig = {
        operatingStatus,
        checkoutEnabled,
        paymentsEnabled,
        headline: headline.trim() || 'Checkout & Payments Temporarily Paused',
        maintenanceNotice: maintenanceNotice.trim()
      };

      const res = await fetch('/api/admin/settings/service-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update service control settings.');
      }

      setSaveSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error updating service controls.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Status Banner */}
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
            <Sliders style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontFamily: 'serif',
                fontWeight: 600,
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Granular Service Control &amp; Circuit Breakers
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Independently manage core storefront systems. Preserve catalog discovery and bag
            curation even during maintenance.
          </p>
        </div>

        {/* Global Operational Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            className={`admin-badge ${isFullyActive ? 'admin-badge-emerald' : 'admin-badge-amber'}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              letterSpacing: '0.04em'
            }}
          >
            {isFullyActive ? (
              <>
                <ShieldCheck style={{ width: '14px', height: '14px', color: '#10B981' }} />
                <span>ALL SYSTEMS OPERATIONAL</span>
              </>
            ) : (
              <>
                <AlertTriangle style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                <span>MAINTENANCE MODE ACTIVE</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Quick Emergency Action Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        <button
          type="button"
          onClick={handleEmergencyPause}
          style={{
            backgroundColor: '#2A1414',
            border: '1px solid #7F1D1D',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#451A1A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Power style={{ width: '20px', height: '20px', color: '#F87171' }} />
          </div>
          <div>
            <div style={{ color: '#FCA5A5', fontWeight: 600, fontSize: '0.9rem' }}>
              Emergency Pause All Checkouts
            </div>
            <div style={{ color: '#F87171', fontSize: '0.75rem', marginTop: '2px', opacity: 0.85 }}>
              Instantly disable checkout &amp; payments while keeping catalog active
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleRestoreLive}
          style={{
            backgroundColor: '#0E2B21',
            border: '1px solid #059669',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#064E3B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#34D399' }} />
          </div>
          <div>
            <div style={{ color: '#6EE7B7', fontWeight: 600, fontSize: '0.9rem' }}>
              Restore All Live Operations
            </div>
            <div style={{ color: '#34D399', fontSize: '0.75rem', marginTop: '2px', opacity: 0.85 }}>
              Enable active store status, checkout submissions &amp; Razorpay
            </div>
          </div>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Granular Service Killswitches */}
        <div className="admin-card">
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#FDFBF7',
              margin: '0 0 16px',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '10px'
            }}
          >
            Granular Service Switches
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Global Operating Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#0B2920',
                borderRadius: '8px',
                border: '1px solid #164335'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Power style={{ width: '20px', height: '20px', color: '#C5A880' }} />
                <div>
                  <div style={{ color: '#FDFBF7', fontWeight: 500, fontSize: '0.9rem' }}>
                    Global Store Operating Mode
                  </div>
                  <div style={{ color: '#8BAAA0', fontSize: '0.775rem', marginTop: '2px' }}>
                    {operatingStatus === 'active'
                      ? 'Live Mode — Storefront operates normally'
                      : 'Maintenance Mode — Core transactions restricted with customer guidance banner'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOperatingStatus('active')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: operatingStatus === 'active' ? '#10B981' : '#1C4D3E',
                    backgroundColor: operatingStatus === 'active' ? '#064E3B' : 'transparent',
                    color: operatingStatus === 'active' ? '#6EE7B7' : '#8BAAA0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingStatus('maintenance')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: operatingStatus === 'maintenance' ? '#F59E0B' : '#1C4D3E',
                    backgroundColor: operatingStatus === 'maintenance' ? '#78350F' : 'transparent',
                    color: operatingStatus === 'maintenance' ? '#FDE68A' : '#8BAAA0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Maintenance
                </button>
              </div>
            </div>

            {/* 2. Checkout & Bag Processing */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#0B2920',
                borderRadius: '8px',
                border: '1px solid #164335'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShoppingBag style={{ width: '20px', height: '20px', color: '#C5A880' }} />
                <div>
                  <div style={{ color: '#FDFBF7', fontWeight: 500, fontSize: '0.9rem' }}>
                    Checkout &amp; Order Placement
                  </div>
                  <div style={{ color: '#8BAAA0', fontSize: '0.775rem', marginTop: '2px' }}>
                    Allows shoppers to initiate checkout and lock inventory reservations
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutEnabled(!checkoutEnabled)}
                aria-label={checkoutEnabled ? 'Disable Checkout' : 'Enable Checkout'}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: checkoutEnabled ? '#10B981' : '#EF4444',
                  backgroundColor: checkoutEnabled ? '#064E3B' : '#451A1A',
                  color: checkoutEnabled ? '#6EE7B7' : '#FCA5A5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {checkoutEnabled ? 'Enabled' : 'Paused'}
              </button>
            </div>

            {/* 3. Razorpay Payment Gateway */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: '#0B2920',
                borderRadius: '8px',
                border: '1px solid #164335'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CreditCard style={{ width: '20px', height: '20px', color: '#C5A880' }} />
                <div>
                  <div style={{ color: '#FDFBF7', fontWeight: 500, fontSize: '0.9rem' }}>
                    Razorpay Payment Gateway Integration
                  </div>
                  <div style={{ color: '#8BAAA0', fontSize: '0.775rem', marginTop: '2px' }}>
                    Allows generating payment orders and opening the Razorpay modal
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPaymentsEnabled(!paymentsEnabled)}
                aria-label={paymentsEnabled ? 'Disable Payments' : 'Enable Payments'}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: paymentsEnabled ? '#10B981' : '#EF4444',
                  backgroundColor: paymentsEnabled ? '#064E3B' : '#451A1A',
                  color: paymentsEnabled ? '#6EE7B7' : '#FCA5A5',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {paymentsEnabled ? 'Enabled' : 'Paused'}
              </button>
            </div>
          </div>
        </div>

        {/* Customer Guidance Notice & Live Preview */}
        <div className="admin-card">
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: '#FDFBF7',
              margin: '0 0 16px',
              borderBottom: '1px solid #1C4D3E',
              paddingBottom: '10px'
            }}
          >
            Customer Reassurance Messaging
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Notice Headline */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '8px'
                }}
              >
                <label
                  htmlFor="maintenanceHeadline"
                  style={{ fontSize: '0.85rem', fontWeight: 500, color: '#FDFBF7' }}
                >
                  Notice Banner Headline
                </label>
                <span style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>
                  {headline.length} / 120 characters
                </span>
              </div>
              <input
                id="maintenanceHeadline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
                placeholder="Notice headline..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#081F18',
                  border: '1px solid #1C4D3E',
                  borderRadius: '6px',
                  color: '#FDFBF7',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Notice Textarea */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '8px'
                }}
              >
                <label
                  htmlFor="maintenanceNotice"
                  style={{ fontSize: '0.85rem', fontWeight: 500, color: '#FDFBF7' }}
                >
                  Notice Banner Text
                </label>
                <span style={{ fontSize: '0.75rem', color: '#8BAAA0' }}>
                  {maintenanceNotice.length} / 500 characters
                </span>
              </div>
              <textarea
                id="maintenanceNotice"
                rows={3}
                value={maintenanceNotice}
                onChange={(e) => setMaintenanceNotice(e.target.value)}
                maxLength={500}
                placeholder="Notice displayed to shoppers when checkout or payment services are paused..."
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#081F18',
                  border: '1px solid #1C4D3E',
                  borderRadius: '6px',
                  color: '#FDFBF7',
                  fontSize: '0.875rem',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* Presets */}
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8BAAA0', marginBottom: '8px' }}>
                Quick Presets:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_NOTICES.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      setHeadline(preset.headline);
                      setMaintenanceNotice(preset.text);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #1C4D3E',
                      backgroundColor: '#0B2920',
                      color: '#C5A880',
                      fontSize: '0.775rem',
                      cursor: 'pointer'
                    }}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Customer Preview */}
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                  color: '#8BAAA0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px'
                }}
              >
                <Eye style={{ width: '14px', height: '14px', color: '#C5A880' }} />
                <span>Customer Storefront Preview</span>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  color: '#92400E'
                }}
              >
                <AlertTriangle
                  style={{
                    width: '20px',
                    height: '20px',
                    flexShrink: 0,
                    marginTop: '2px',
                    color: '#D97706'
                  }}
                />
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      marginBottom: '4px',
                      color: '#92400E'
                    }}
                  >
                    {headline || 'Checkout & Payments Temporarily Paused'}
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5, color: '#B45309' }}>
                    {maintenanceNotice ||
                      'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#064E3B',
              border: '1px solid #059669',
              borderRadius: '8px',
              color: '#6EE7B7',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem'
            }}
          >
            <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>Service control configuration published successfully to live store.</span>
          </div>
        )}

        {saveError && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#451A1A',
              border: '1px solid #EF4444',
              borderRadius: '8px',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem'
            }}
          >
            <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="admin-btn-primary"
            style={{
              padding: '10px 24px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSaving ? (
              <>
                <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <ShieldCheck style={{ width: '16px', height: '16px' }} />
                <span>Save &amp; Apply Controls</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
