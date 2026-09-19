'use client';

import { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2
} from 'lucide-react';
import type {
  AdminInventoryItem,
  AdminInventorySummary,
  InventoryAuditLogItem,
  InventoryAuditReason
} from '@hh/domain';

interface InventoryManagerProps {
  initialItems: AdminInventoryItem[];
  initialSummary: AdminInventorySummary;
  initialAuditLogs: InventoryAuditLogItem[];
}

type FilterTab = 'all' | 'needs_restock' | 'published' | 'drafts';

export default function InventoryManager({
  initialItems,
  initialSummary,
  initialAuditLogs
}: InventoryManagerProps) {
  const [items, setItems] = useState<AdminInventoryItem[]>(initialItems);
  const [summary, setSummary] = useState<AdminInventorySummary>(initialSummary);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLogItem[]>(initialAuditLogs);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Custom Adjust Modal State
  const [adjustModalItem, setAdjustModalItem] = useState<AdminInventoryItem | null>(null);
  const [customDelta, setCustomDelta] = useState<number>(5);
  const [customReason, setCustomReason] = useState<InventoryAuditReason>('manual_restock');
  const [customNote, setCustomNote] = useState('');

  // Price Edit State
  const [editingPriceVariantId, setEditingPriceVariantId] = useState<string | null>(null);
  const [newPriceInput, setNewPriceInput] = useState<string>('');

  // Audit Logs Drawer State
  const [selectedVariantAuditId, setSelectedVariantAuditId] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Tab filter
      if (activeTab === 'needs_restock') {
        if (!item.isLowStock && !item.isOutOfStock) return false;
      } else if (activeTab === 'published') {
        if (item.productStatus !== 'published') return false;
      } else if (activeTab === 'drafts') {
        if (item.productStatus !== 'draft') return false;
      }

      // 2. Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.productTitle.toLowerCase().includes(q);
        const matchesSku = item.variantSku.toLowerCase().includes(q);
        return matchesTitle || matchesSku;
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

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
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  // Quick Restock API Call
  const handleQuickAdjust = async (
    variantId: string,
    delta: number,
    reason: InventoryAuditReason = 'manual_restock',
    note?: string
  ) => {
    setIsLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          delta,
          reason,
          ...(note ? { note } : {})
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to adjust inventory');
      }

      // Update local state
      setItems((prev) =>
        prev.map((item) => {
          if (item.variantId === variantId) {
            const newOnHand = data.level.onHand;
            const newAvailable = Math.max(0, newOnHand - item.reserved);
            return {
              ...item,
              onHand: newOnHand,
              available: newAvailable,
              isLowStock: newAvailable <= 3 && newAvailable > 0,
              isOutOfStock: newAvailable <= 0,
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        })
      );

      // Prepend to audit logs
      if (data.auditLog) {
        const matchedItem = items.find((i) => i.variantId === variantId);
        const newLog: InventoryAuditLogItem = {
          id: data.auditLog.id,
          variantId,
          variantSku: matchedItem?.variantSku || 'SKU',
          productTitle: matchedItem?.productTitle || 'Product',
          previousOnHand: data.auditLog.previousOnHand,
          newOnHand: data.auditLog.newOnHand,
          delta: data.auditLog.delta,
          reason: data.auditLog.reason,
          note: data.auditLog.note || undefined,
          createdAt: data.auditLog.createdAt
        };
        setAuditLogs((prev) => [newLog, ...prev]);
      }

      // Re-calculate summary
      setSummary((prev) => ({
        ...prev,
        totalOnHand: prev.totalOnHand + delta,
        totalAvailable: prev.totalAvailable + delta
      }));

      setActionSuccess(`Successfully adjusted stock (${delta > 0 ? `+${delta}` : delta} units)`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to adjust stock');
    } finally {
      setIsLoading(false);
      setAdjustModalItem(null);
    }
  };

  // Price Update API Call
  const handlePriceUpdate = async (variantId: string, priceRupees: number) => {
    setIsLoading(true);
    setActionError(null);
    setActionSuccess(null);

    const priceMinor = Math.round(priceRupees * 100);
    try {
      const res = await fetch('/api/admin/inventory/price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, priceMinor })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update price');
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.variantId === variantId) {
            return { ...item, priceMinor };
          }
          return item;
        })
      );

      setActionSuccess('Price updated successfully');
      setTimeout(() => setActionSuccess(null), 3000);
      setEditingPriceVariantId(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update price');
    } finally {
      setIsLoading(false);
    }
  };

  // Product Status Toggle API Call
  const handleStatusToggle = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    setIsLoading(true);
    setActionError(null);

    try {
      const res = await fetch('/api/admin/inventory/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.productId === productId) {
            return { ...item, productStatus: nextStatus as 'draft' | 'published' };
          }
          return item;
        })
      );

      setActionSuccess(`Product status changed to ${nextStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to toggle status');
    } finally {
      setIsLoading(false);
    }
  };

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
          Inventory &amp; Stock Command
        </h1>
        <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
          Manage artisan piece quantities, quick restocks, real-time pricing, and stock audit
          trails.
        </p>
      </div>

      {/* Notifications */}
      {actionError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#3B1313',
            border: '1px solid #7F1D1D',
            color: '#F87171',
            fontSize: '0.875rem'
          }}
        >
          <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#0F392B',
            border: '1px solid #165D46',
            color: '#6EE7B7',
            fontSize: '0.875rem'
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Dashboard Cards */}
      <div className="admin-kpi-grid">
        {/* Total Available Units */}
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
              Available Stock
            </span>
            <Boxes style={{ width: '16px', height: '16px', color: '#73A796' }} />
          </div>
          <div className="admin-kpi-value">{summary.totalAvailable}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>
            {summary.totalOnHand} total on hand &bull; {summary.totalReserved} reserved
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className={`admin-kpi-card ${summary.lowStockCount > 0 ? 'urgent' : ''}`}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: summary.lowStockCount > 0 ? '#C5A880' : '#8BAAA0'
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
              Low Stock (&le; 3)
            </span>
            <AlertTriangle
              style={{
                width: '16px',
                height: '16px',
                color: summary.lowStockCount > 0 ? '#C5A880' : '#8BAAA0'
              }}
            />
          </div>
          <div className="admin-kpi-value">{summary.lowStockCount}</div>
          <div style={{ fontSize: '0.6875rem', color: '#A08865' }}>SKUs needing reorder</div>
        </div>

        {/* Out of Stock */}
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
              Out of Stock
            </span>
            <X style={{ width: '16px', height: '16px', color: '#F87171' }} />
          </div>
          <div className="admin-kpi-value">{summary.outOfStockCount}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>Sold out variants</div>
        </div>

        {/* Total Variants */}
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
              Total SKUs
            </span>
            <Boxes style={{ width: '16px', height: '16px', color: '#C5A880' }} />
          </div>
          <div className="admin-kpi-value">{summary.totalVariants}</div>
          <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>Catalog active models</div>
        </div>
      </div>

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
        {/* Filter Tabs */}
        <div className="admin-tabs-bar">
          <button
            onClick={() => setActiveTab('all')}
            className={`admin-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          >
            All SKUs ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('needs_restock')}
            className={`admin-tab-btn ${activeTab === 'needs_restock' ? 'active' : ''}`}
            style={{
              color:
                summary.lowStockCount + summary.outOfStockCount > 0 && activeTab !== 'needs_restock'
                  ? '#C5A880'
                  : undefined
            }}
          >
            Needs Restock ({summary.lowStockCount + summary.outOfStockCount})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`admin-tab-btn ${activeTab === 'published' ? 'active' : ''}`}
          >
            Published
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`admin-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
          >
            Drafts
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: '#8BAAA0',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Search piece by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
            style={{ paddingLeft: '36px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#8BAAA0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Artisanal Piece</th>
              <th>Status</th>
              <th>Price (₹)</th>
              <th style={{ textAlign: 'center' }}>Stock (Available)</th>
              <th>Quick Restock</th>
              <th style={{ textAlign: 'right' }}>Audit</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: 'center',
                    padding: '48px 16px',
                    color: '#8BAAA0'
                  }}
                >
                  <Boxes
                    style={{
                      width: '32px',
                      height: '32px',
                      color: '#235847',
                      margin: '0 auto 12px'
                    }}
                  />
                  <div>No inventory items matched your filter.</div>
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr key={item.variantId}>
                  {/* Product & Variant */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.primaryImageUrl ? (
                        <img
                          src={item.primaryImageUrl}
                          alt={item.productTitle}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            objectFit: 'cover',
                            border: '1px solid #1C4D3E'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '6px',
                            backgroundColor: '#164335',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #1C4D3E'
                          }}
                        >
                          <Boxes style={{ width: '18px', height: '18px', color: '#8BAAA0' }} />
                        </div>
                      )}
                      <div>
                        <a
                          href={`/products/${item.productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#FDFBF7',
                            fontWeight: 600,
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                          }}
                        >
                          {item.productTitle}
                        </a>
                        <div
                          style={{
                            fontSize: '0.6875rem',
                            color: '#8BAAA0',
                            fontFamily: 'monospace',
                            marginTop: '2px'
                          }}
                        >
                          {item.variantSku} &bull; {item.variantTitle}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td>
                    <button
                      onClick={() => handleStatusToggle(item.productId, item.productStatus)}
                      disabled={isLoading}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Click to toggle status"
                    >
                      <span
                        className={`admin-badge ${
                          item.productStatus === 'published'
                            ? 'admin-badge-emerald'
                            : 'admin-badge-gold'
                        }`}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.productStatus}
                      </span>
                    </button>
                  </td>

                  {/* Price */}
                  <td>
                    {editingPriceVariantId === item.variantId ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          value={newPriceInput}
                          onChange={(e) => setNewPriceInput(e.target.value)}
                          placeholder="Price ₹"
                          style={{
                            width: '80px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#081F18',
                            border: '1px solid #C5A880',
                            color: '#FDFBF7',
                            fontSize: '0.8125rem'
                          }}
                        />
                        <button
                          onClick={() =>
                            handlePriceUpdate(item.variantId, parseFloat(newPriceInput))
                          }
                          className="admin-btn-primary"
                          style={{ minHeight: '28px', padding: '4px 8px', fontSize: '0.6875rem' }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPriceVariantId(null)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8BAAA0',
                            cursor: 'pointer',
                            fontSize: '0.6875rem'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#C5A880' }}>
                          {formatPrice(item.priceMinor)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingPriceVariantId(item.variantId);
                            setNewPriceInput(String(item.priceMinor / 100));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8BAAA0',
                            cursor: 'pointer',
                            fontSize: '0.6875rem',
                            textDecoration: 'underline'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Stock Level Details */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 700,
                          color:
                            item.available <= 0
                              ? '#F87171'
                              : item.isLowStock
                                ? '#FBBF24'
                                : '#34D399'
                        }}
                      >
                        {item.available}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#8BAAA0' }}>
                        {item.onHand} on hand &bull; {item.reserved} held
                      </span>
                    </div>
                  </td>

                  {/* Quick Restock Buttons */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {[1, 5, 10, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleQuickAdjust(item.variantId, num, 'manual_restock')}
                          disabled={isLoading}
                          className="admin-btn-secondary"
                          style={{
                            minHeight: '28px',
                            padding: '3px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '6px'
                          }}
                          title={`Add +${num} stock`}
                        >
                          +{num}
                        </button>
                      ))}

                      <button
                        onClick={() => {
                          setAdjustModalItem(item);
                          setCustomDelta(5);
                          setCustomReason('manual_restock');
                          setCustomNote('');
                        }}
                        className="admin-btn-secondary"
                        style={{
                          minHeight: '28px',
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          borderRadius: '6px',
                          color: '#C5A880'
                        }}
                        title="Custom stock adjustment"
                      >
                        Custom &plusmn;
                      </button>
                    </div>
                  </td>

                  {/* Audit Logs */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() =>
                        setSelectedVariantAuditId(
                          selectedVariantAuditId === item.variantId ? null : item.variantId
                        )
                      }
                      className="admin-btn-secondary"
                      style={{
                        minHeight: '32px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        backgroundColor:
                          selectedVariantAuditId === item.variantId ? '#164335' : undefined
                      }}
                      title="View audit logs"
                    >
                      <History style={{ width: '14px', height: '14px' }} />
                      <span>History</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Adjustment Modal */}
      {adjustModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
        >
          <div
            className="admin-card"
            style={{ width: '100%', maxWidth: '440px', position: 'relative' }}
          >
            <button
              onClick={() => setAdjustModalItem(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#8BAAA0',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '18px', height: '18px' }} />
            </button>

            <h3
              style={{
                fontSize: '1.25rem',
                fontFamily: 'serif',
                color: '#FDFBF7',
                margin: '0 0 4px'
              }}
            >
              Adjust Inventory Stock
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: '0 0 16px' }}>
              {adjustModalItem.productTitle} &bull;{' '}
              <span style={{ fontFamily: 'monospace' }}>{adjustModalItem.variantSku}</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#C5A880',
                    fontWeight: 600,
                    marginBottom: '6px'
                  }}
                >
                  Units to Adjust (+/-)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={customDelta}
                    onChange={(e) => setCustomDelta(parseInt(e.target.value) || 0)}
                    className="admin-search-input"
                    style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
                  />
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#8BAAA0', marginTop: '4px' }}>
                  Current on hand: {adjustModalItem.onHand} &bull; Resulting on hand:{' '}
                  {adjustModalItem.onHand + customDelta}
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#C5A880',
                    fontWeight: 600,
                    marginBottom: '6px'
                  }}
                >
                  Adjustment Reason
                </label>
                <select
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value as InventoryAuditReason)}
                  className="admin-search-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  <option value="manual_restock">Artisan Batch Restock (+)</option>
                  <option value="manual_correction">Count Correction (&plusmn;)</option>
                  <option value="damaged">Damaged / Defective Stock (-)</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    color: '#C5A880',
                    fontWeight: 600,
                    marginBottom: '6px'
                  }}
                >
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment from artisan workshop"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="admin-search-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '8px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAdjust(
                      adjustModalItem.variantId,
                      customDelta,
                      customReason,
                      customNote
                    )
                  }
                  disabled={isLoading || customDelta === 0}
                  className="admin-btn-primary"
                >
                  {isLoading ? 'Updating...' : 'Confirm Adjustment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Timeline Section */}
      <div className="admin-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History style={{ width: '18px', height: '18px', color: '#C5A880' }} />
            <h2 style={{ fontSize: '1rem', color: '#FDFBF7', margin: 0, fontWeight: 600 }}>
              {selectedVariantAuditId
                ? `Audit History for ${items.find((i) => i.variantId === selectedVariantAuditId)?.variantSku}`
                : 'Recent Inventory Movements'}
            </h2>
          </div>
          {selectedVariantAuditId && (
            <button
              onClick={() => setSelectedVariantAuditId(null)}
              className="admin-btn-secondary"
              style={{ minHeight: '30px', padding: '3px 8px', fontSize: '0.75rem' }}
            >
              Show All SKUs
            </button>
          )}
        </div>

        {auditLogs.length === 0 ? (
          <div
            style={{
              color: '#8BAAA0',
              fontSize: '0.8125rem',
              textAlign: 'center',
              padding: '16px'
            }}
          >
            No stock movements recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditLogs
              .filter((log) => !selectedVariantAuditId || log.variantId === selectedVariantAuditId)
              .slice(0, 15)
              .map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0A251D',
                    border: '1px solid #1C4D3E',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {log.delta > 0 ? (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#064E3B',
                          color: '#34D399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ArrowUpRight style={{ width: '14px', height: '14px' }} />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#451A1A',
                          color: '#F87171',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ArrowDownRight style={{ width: '14px', height: '14px' }} />
                      </div>
                    )}
                    <div>
                      <span style={{ color: '#FDFBF7', fontWeight: 600 }}>{log.productTitle}</span>{' '}
                      <span style={{ color: '#8BAAA0', fontFamily: 'monospace' }}>
                        ({log.variantSku})
                      </span>
                      <div style={{ fontSize: '0.6875rem', color: '#698D80' }}>
                        Reason:{' '}
                        <span style={{ color: '#C5A880' }}>{log.reason.replace(/_/g, ' ')}</span>
                        {log.note ? ` &bull; "${log.note}"` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: log.delta > 0 ? '#34D399' : '#F87171'
                      }}
                    >
                      {log.delta > 0 ? `+${log.delta}` : log.delta} ({log.previousOnHand} &rarr;{' '}
                      {log.newOnHand})
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#8BAAA0' }}>
                      {formatDate(log.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
