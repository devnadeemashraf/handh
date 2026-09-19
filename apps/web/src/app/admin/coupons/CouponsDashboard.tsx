'use client';

import { Check, CheckCircle2, Copy, Plus, RefreshCw, Search, Sparkles, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { Coupon, DiscountType } from '@hh/domain';

interface CouponsDashboardProps {
  initialCoupons: Coupon[];
}

export default function CouponsDashboard({ initialCoupons }: CouponsDashboardProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minOrderValueRupees, setMinOrderValueRupees] = useState<number>(500);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showSuccessNotice = (msg: string) => {
    setActionSuccess(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const updatedStatus = !coupon.isActive;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update coupon status.');
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: updatedStatus } : c))
      );
      showSuccessNotice(`Coupon '${coupon.code}' ${updatedStatus ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating coupon.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const numericValue =
        discountType === 'percentage'
          ? Math.max(1, Math.min(100, Number(value)))
          : Math.round(Number(value) * 100);

      const minOrderValueMinor = Math.round((Number(minOrderValueRupees) || 0) * 100);
      const maxDiscountMinor =
        discountType === 'percentage' && maxDiscountRupees.trim() !== ''
          ? Math.round(Number(maxDiscountRupees) * 100)
          : null;
      const parsedUsageLimit = usageLimit.trim() !== '' ? parseInt(usageLimit, 10) : null;

      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        value: numericValue,
        minOrderValueMinor,
        maxDiscountMinor,
        usageLimit: parsedUsageLimit,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create coupon.');
      }

      setCoupons((prev) => [data.coupon, ...prev]);
      setIsModalOpen(false);
      resetForm();
      showSuccessNotice(`Coupon '${data.coupon.code}' created successfully.`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setValue(10);
    setMinOrderValueRupees(500);
    setMaxDiscountRupees('');
    setUsageLimit('');
    setStartsAt('');
    setExpiresAt('');
    setIsActive(true);
    setFormError(null);
  };

  // Filter and search
  const filteredCoupons = coupons.filter((c) => {
    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'active' && c.isActive) ||
      (filterTab === 'inactive' && !c.isActive);

    const matchesSearch =
      searchQuery.trim() === '' || c.code.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesTab && matchesSearch;
  });

  const totalCoupons = coupons.length;
  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.timesUsed, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
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
            <Tag style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h2
              style={{
                fontSize: '1.25rem',
                fontFamily: 'serif',
                fontWeight: 600,
                color: '#FDFBF7',
                margin: 0
              }}
            >
              Promotional Coupons &amp; Discounts
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Drive social campaigns and reward loyal patrons with flexible cart and checkout discount
            codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="admin-btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* KPI Scorecards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
        <div className="admin-card">
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Active Coupons
          </span>
          <div
            style={{
              fontSize: '1.75rem',
              fontFamily: 'serif',
              fontWeight: 700,
              color: '#FDFBF7',
              marginTop: '6px'
            }}
          >
            {activeCount}
            <span
              style={{ fontSize: '0.875rem', color: '#8BAAA0', fontWeight: 400, marginLeft: '6px' }}
            >
              / {totalCoupons} total
            </span>
          </div>
        </div>

        <div className="admin-card">
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Total Redemptions
          </span>
          <div
            style={{
              fontSize: '1.75rem',
              fontFamily: 'serif',
              fontWeight: 700,
              color: '#FDFBF7',
              marginTop: '6px'
            }}
          >
            {totalRedemptions}
          </div>
        </div>

        <div className="admin-card">
          <span
            style={{
              fontSize: '0.75rem',
              color: '#8BAAA0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Active Strategies
          </span>
          <div style={{ fontSize: '0.9rem', color: '#6EE7B7', fontWeight: 500, marginTop: '10px' }}>
            Percentage &amp; Flat Rupee Discounts
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
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
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Controls Bar: Tabs & Search */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: filterTab === tab ? '#C5A880' : '#1C4D3E',
                backgroundColor: filterTab === tab ? '#164335' : 'transparent',
                color: filterTab === tab ? '#FDFBF7' : '#8BAAA0',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'all' ? 'All Coupons' : tab}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              color: '#8BAAA0'
            }}
          />
          <input
            type="text"
            placeholder="Search coupon code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px 6px 32px',
              backgroundColor: '#081F18',
              border: '1px solid #1C4D3E',
              borderRadius: '6px',
              color: '#FDFBF7',
              fontSize: '0.8rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B2920', borderBottom: '1px solid #1C4D3E' }}>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  COUPON CODE
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  DISCOUNT VALUE
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  MIN. ORDER
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  USAGE &amp; REDEMPTIONS
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  EXPIRATION
                </th>
                <th
                  style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    color: '#8BAAA0'
                  }}
                >
                  STATUS &amp; ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: '36px 16px', textAlign: 'center', color: '#8BAAA0' }}
                  >
                    No promotional coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #164335',
                        backgroundColor:
                          !c.isActive || isExpired ? 'rgba(11, 41, 32, 0.4)' : 'transparent'
                      }}
                    >
                      {/* Code Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: '#C5A880',
                              backgroundColor: '#081F18',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #1C4D3E',
                              letterSpacing: '0.05em'
                            }}
                          >
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            aria-label={`Copy coupon ${c.code}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#8BAAA0',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                          >
                            {copiedCode === c.code ? (
                              <Check style={{ width: '14px', height: '14px', color: '#10B981' }} />
                            ) : (
                              <Copy style={{ width: '14px', height: '14px' }} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#FDFBF7' }}>
                        {c.discountType === 'percentage' ? (
                          <span>
                            <strong>{c.value}%</strong> Off
                            {c.maxDiscountMinor ? (
                              <span
                                style={{ fontSize: '0.75rem', color: '#8BAAA0', display: 'block' }}
                              >
                                Capped at ₹{c.maxDiscountMinor / 100}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span>
                            <strong>₹{c.value / 100}</strong> Flat Off
                          </span>
                        )}
                      </td>

                      {/* Min Order */}
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#FDFBF7' }}>
                        {c.minOrderValueMinor > 0 ? `₹${c.minOrderValueMinor / 100}` : 'None'}
                      </td>

                      {/* Usage */}
                      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#8BAAA0' }}>
                        <span style={{ color: '#FDFBF7', fontWeight: 600 }}>{c.timesUsed}</span>
                        {c.usageLimit ? ` / ${c.usageLimit} max` : ' (unlimited)'}
                      </td>

                      {/* Expiration */}
                      <td
                        style={{
                          padding: '14px 16px',
                          fontSize: '0.8rem',
                          color: isExpired ? '#EF4444' : '#8BAAA0'
                        }}
                      >
                        {c.expiresAt ? (
                          <>
                            <div>{new Date(c.expiresAt).toLocaleDateString('en-IN')}</div>
                            {isExpired && (
                              <span style={{ fontSize: '0.725rem', color: '#EF4444' }}>
                                Expired
                              </span>
                            )}
                          </>
                        ) : (
                          'Never'
                        )}
                      </td>

                      {/* Toggle & Action */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          aria-label={
                            c.isActive ? `Pause coupon ${c.code}` : `Activate coupon ${c.code}`
                          }
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid',
                            borderColor: c.isActive ? '#10B981' : '#1C4D3E',
                            backgroundColor: c.isActive ? '#064E3B' : 'transparent',
                            color: c.isActive ? '#6EE7B7' : '#8BAAA0',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {c.isActive ? 'Active' : 'Paused'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 31, 24, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 100,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: '#0B2920',
              border: '1px solid #1C4D3E',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles style={{ width: '18px', height: '18px', color: '#C5A880' }} />
                <h3
                  style={{ fontSize: '1.125rem', fontFamily: 'serif', color: '#FDFBF7', margin: 0 }}
                >
                  Create Promotional Coupon
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                style={{ background: 'none', border: 'none', color: '#8BAAA0', cursor: 'pointer' }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#451A1A',
                  border: '1px solid #EF4444',
                  borderRadius: '6px',
                  color: '#FCA5A5',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleCreateCoupon}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* Code */}
              <div>
                <label
                  htmlFor="couponCode"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Coupon Code *
                </label>
                <input
                  id="couponCode"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EIDGIFT15, WELCOME10"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#C5A880',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Discount Strategy *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: discountType === 'percentage' ? '#C5A880' : '#1C4D3E',
                      backgroundColor: discountType === 'percentage' ? '#164335' : '#081F18',
                      color: discountType === 'percentage' ? '#FDFBF7' : '#8BAAA0',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Percentage Off (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: discountType === 'fixed' ? '#C5A880' : '#1C4D3E',
                      backgroundColor: discountType === 'fixed' ? '#164335' : '#081F18',
                      color: discountType === 'fixed' ? '#FDFBF7' : '#8BAAA0',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Flat Rupee Off (₹)
                  </button>
                </div>
              </div>

              {/* Value & Min Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    htmlFor="discountValue"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#FDFBF7',
                      marginBottom: '6px'
                    }}
                  >
                    {discountType === 'percentage' ? 'Percentage (1-100%) *' : 'Amount in ₹ *'}
                  </label>
                  <input
                    id="discountValue"
                    type="number"
                    required
                    min={1}
                    max={discountType === 'percentage' ? 100 : 50000}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#081F18',
                      border: '1px solid #1C4D3E',
                      borderRadius: '6px',
                      color: '#FDFBF7',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="minOrderValue"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#FDFBF7',
                      marginBottom: '6px'
                    }}
                  >
                    Min Order Value (₹)
                  </label>
                  <input
                    id="minOrderValue"
                    type="number"
                    min={0}
                    value={minOrderValueRupees}
                    onChange={(e) => setMinOrderValueRupees(Number(e.target.value))}
                    placeholder="e.g. 500"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#081F18',
                      border: '1px solid #1C4D3E',
                      borderRadius: '6px',
                      color: '#FDFBF7',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Optional: Max Discount Cap & Usage Limit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    htmlFor="maxDiscount"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#FDFBF7',
                      marginBottom: '6px'
                    }}
                  >
                    Max Discount Cap (₹)
                  </label>
                  <input
                    id="maxDiscount"
                    type="number"
                    disabled={discountType !== 'percentage'}
                    value={maxDiscountRupees}
                    onChange={(e) => setMaxDiscountRupees(e.target.value)}
                    placeholder={
                      discountType === 'percentage' ? 'e.g. 200 (optional)' : 'N/A for flat'
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#081F18',
                      border: '1px solid #1C4D3E',
                      borderRadius: '6px',
                      color: '#FDFBF7',
                      outline: 'none',
                      opacity: discountType !== 'percentage' ? 0.4 : 1
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="usageLimit"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#FDFBF7',
                      marginBottom: '6px'
                    }}
                  >
                    Total Redemptions Cap
                  </label>
                  <input
                    id="usageLimit"
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 100 (optional)"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#081F18',
                      border: '1px solid #1C4D3E',
                      borderRadius: '6px',
                      color: '#FDFBF7',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label
                  htmlFor="expiresAt"
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: '#FDFBF7',
                    marginBottom: '6px'
                  }}
                >
                  Expiration Date (optional)
                </label>
                <input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#081F18',
                    border: '1px solid #1C4D3E',
                    borderRadius: '6px',
                    color: '#FDFBF7',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="admin-btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="admin-btn-primary"
                  style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw
                        className="animate-spin"
                        style={{ width: '14px', height: '14px' }}
                      />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Publish Coupon</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
