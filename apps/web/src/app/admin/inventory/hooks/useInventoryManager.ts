import { useMemo, useState } from 'react';

import type {
  AdminInventoryItem,
  AdminInventorySummary,
  InventoryAuditLogItem,
  InventoryAuditReason
} from '@hh/domain';

import type { FilterTab } from '../types';

interface UseInventoryManagerProps {
  initialItems: AdminInventoryItem[];
  initialSummary: AdminInventorySummary;
  initialAuditLogs: InventoryAuditLogItem[];
}

export function useInventoryManager({
  initialItems,
  initialSummary,
  initialAuditLogs
}: UseInventoryManagerProps) {
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

  return {
    items,
    summary,
    auditLogs,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredItems,
    isLoading,
    actionError,
    actionSuccess,
    adjustModalItem,
    setAdjustModalItem,
    customDelta,
    setCustomDelta,
    customReason,
    setCustomReason,
    customNote,
    setCustomNote,
    editingPriceVariantId,
    setEditingPriceVariantId,
    newPriceInput,
    setNewPriceInput,
    selectedVariantAuditId,
    setSelectedVariantAuditId,
    handleQuickAdjust,
    handlePriceUpdate,
    handleStatusToggle
  };
}
