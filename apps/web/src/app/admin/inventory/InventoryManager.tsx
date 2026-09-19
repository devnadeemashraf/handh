'use client';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  History,
  Package,
  Search,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight mb-1">
          Inventory &amp; Stock Command
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage artisan piece quantities, quick restocks, real-time pricing, and stock audit
          trails.
        </p>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Available Units */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available Stock
            </span>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {summary.totalAvailable}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
              {summary.totalOnHand} total on hand &bull; {summary.totalReserved} reserved
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Warning */}
        <Card
          className={cn(
            'border-border bg-card shadow-xs',
            summary.lowStockCount > 0 && 'border-accent/40 bg-accent/5'
          )}
        >
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span
              className={cn(
                'text-[11px] sm:text-xs font-semibold uppercase tracking-wider',
                summary.lowStockCount > 0 ? 'text-accent font-bold' : 'text-muted-foreground'
              )}
            >
              Low Stock (&le; 3)
            </span>
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                summary.lowStockCount > 0 ? 'text-accent' : 'text-muted-foreground'
              )}
            />
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {summary.lowStockCount}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
              SKUs needing reorder
            </p>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Out of Stock
            </span>
            <X className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {summary.outOfStockCount}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Sold out variants</p>
          </CardContent>
        </Card>

        {/* Total Variants */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total SKUs
            </span>
            <Package className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {summary.totalVariants}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
              Catalog active models
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All SKUs ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('needs_restock')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
              activeTab === 'needs_restock'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : summary.lowStockCount + summary.outOfStockCount > 0
                  ? 'text-accent font-semibold hover:text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Needs Restock ({summary.lowStockCount + summary.outOfStockCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('published')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
              activeTab === 'published'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Published
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
              activeTab === 'drafts'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Drafts
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search piece by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-10 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inventory Table Container */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Artisanal Piece
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Price (₹)
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Stock (Available)
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quick Restock
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Audit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 px-4 text-muted-foreground">
                    <Boxes className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                    <div>No inventory items matched your filter.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.variantId} className="hover:bg-muted/20 transition-colors">
                    {/* Product & Variant */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.primaryImageUrl ? (
                          <img
                            src={item.primaryImageUrl}
                            alt={item.productTitle}
                            className="w-10 h-10 rounded-md object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                            <Boxes className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <a
                            href={`/products/${item.productSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground hover:text-accent transition-colors block text-sm"
                          >
                            {item.productTitle}
                          </a>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {item.variantSku} &bull; {item.variantTitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(item.productId, item.productStatus)}
                        disabled={isLoading}
                        title="Click to toggle status"
                        className="cursor-pointer focus:outline-none"
                      >
                        <Badge
                          variant={item.productStatus === 'published' ? 'default' : 'secondary'}
                          className="capitalize cursor-pointer"
                        >
                          {item.productStatus}
                        </Badge>
                      </button>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      {editingPriceVariantId === item.variantId ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            value={newPriceInput}
                            onChange={(e) => setNewPriceInput(e.target.value)}
                            placeholder="Price ₹"
                            className="w-20 h-7 text-xs px-2"
                          />
                          <Button
                            size="sm"
                            onClick={() =>
                              handlePriceUpdate(item.variantId, parseFloat(newPriceInput))
                            }
                            className="h-7 px-2 text-xs"
                          >
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPriceVariantId(null)}
                            className="h-7 px-2 text-xs text-muted-foreground"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-accent">
                            {formatPrice(item.priceMinor)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceVariantId(item.variantId);
                              setNewPriceInput(String(item.priceMinor / 100));
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Stock Level Details */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'text-base font-bold',
                            item.available <= 0
                              ? 'text-destructive'
                              : item.isLowStock
                                ? 'text-amber-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                          )}
                        >
                          {item.available}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {item.onHand} on hand &bull; {item.reserved} held
                        </span>
                      </div>
                    </td>

                    {/* Quick Restock Buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[1, 5, 10, 20].map((num) => (
                          <Button
                            key={num}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAdjust(item.variantId, num, 'manual_restock')}
                            disabled={isLoading}
                            className="h-7 px-2 text-xs"
                            title={`Add +${num} stock`}
                          >
                            +{num}
                          </Button>
                        ))}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustModalItem(item);
                            setCustomDelta(5);
                            setCustomReason('manual_restock');
                            setCustomNote('');
                          }}
                          className="h-7 px-2 text-xs text-accent border-accent/40 hover:bg-accent/10"
                          title="Custom stock adjustment"
                        >
                          Custom &plusmn;
                        </Button>
                      </div>
                    </td>

                    {/* Audit Logs */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={selectedVariantAuditId === item.variantId ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setSelectedVariantAuditId(
                            selectedVariantAuditId === item.variantId ? null : item.variantId
                          )
                        }
                        className="h-7 px-2.5 text-xs gap-1.5"
                        title="View audit logs"
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>History</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Custom Adjustment Modal */}
      <Dialog
        open={Boolean(adjustModalItem)}
        onOpenChange={(open) => {
          if (!open) setAdjustModalItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Adjust Inventory Stock</DialogTitle>
            {adjustModalItem && (
              <DialogDescription className="text-xs">
                {adjustModalItem.productTitle} &bull;{' '}
                <span className="font-mono font-medium text-foreground">
                  {adjustModalItem.variantSku}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {adjustModalItem && (
            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-accent">Units to Adjust (+/-)</label>
                <Input
                  type="number"
                  value={customDelta}
                  onChange={(e) => setCustomDelta(parseInt(e.target.value) || 0)}
                  className="font-semibold text-base"
                />
                <div className="text-[11px] text-muted-foreground">
                  Current on hand: {adjustModalItem.onHand} &bull; Resulting on hand:{' '}
                  {adjustModalItem.onHand + customDelta}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-accent">Adjustment Reason</label>
                <select
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value as InventoryAuditReason)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  <option value="manual_restock">Artisan Batch Restock (+)</option>
                  <option value="manual_correction">Count Correction (&plusmn;)</option>
                  <option value="damaged">Damaged / Defective Stock (-)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-accent">Note (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. Received shipment from artisan workshop"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAdjustModalItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (adjustModalItem) {
                  handleQuickAdjust(
                    adjustModalItem.variantId,
                    customDelta,
                    customReason,
                    customNote
                  );
                }
              }}
              disabled={isLoading || customDelta === 0}
            >
              {isLoading ? 'Updating...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Log Timeline Section */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">
              {selectedVariantAuditId
                ? `Audit History for ${items.find((i) => i.variantId === selectedVariantAuditId)?.variantSku}`
                : 'Recent Inventory Movements'}
            </CardTitle>
          </div>
          {selectedVariantAuditId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVariantAuditId(null)}
              className="h-7 px-2.5 text-xs"
            >
              Show All SKUs
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          {auditLogs.length === 0 ? (
            <div className="text-muted-foreground text-xs text-center py-6">
              No stock movements recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {auditLogs
                .filter(
                  (log) => !selectedVariantAuditId || log.variantId === selectedVariantAuditId
                )
                .slice(0, 15)
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {log.delta > 0 ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-foreground">{log.productTitle}</span>{' '}
                        <span className="text-muted-foreground font-mono">({log.variantSku})</span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Reason:{' '}
                          <span className="text-accent font-medium">
                            {log.reason.replace(/_/g, ' ')}
                          </span>
                          {log.note ? ` &bull; "${log.note}"` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={cn(
                          'font-bold',
                          log.delta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-destructive'
                        )}
                      >
                        {log.delta > 0 ? `+${log.delta}` : log.delta} ({log.previousOnHand} &rarr;{' '}
                        {log.newOnHand})
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
