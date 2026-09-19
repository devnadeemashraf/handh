'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { InventoryAuditTimeline } from './components/InventoryAuditTimeline';
import { InventoryKpiCards } from './components/InventoryKpiCards';
import { InventoryTable } from './components/InventoryTable';
import { InventoryToolbar } from './components/InventoryToolbar';
import { StockAdjustDialog } from './components/StockAdjustDialog';
import { useInventoryManager } from './hooks/useInventoryManager';

import type { InventoryManagerProps } from './types';

export default function InventoryManager({
  initialItems,
  initialSummary,
  initialAuditLogs
}: InventoryManagerProps) {
  const {
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
  } = useInventoryManager({ initialItems, initialSummary, initialAuditLogs });

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
      <InventoryKpiCards summary={summary} />

      {/* Search & Tabs Controls */}
      <InventoryToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={items.length}
        lowStockCount={summary.lowStockCount}
        outOfStockCount={summary.outOfStockCount}
      />

      {/* Inventory Table */}
      <InventoryTable
        items={filteredItems}
        isLoading={isLoading}
        editingPriceVariantId={editingPriceVariantId}
        newPriceInput={newPriceInput}
        selectedVariantAuditId={selectedVariantAuditId}
        onSetEditingPriceVariantId={setEditingPriceVariantId}
        onSetNewPriceInput={setNewPriceInput}
        onPriceUpdate={handlePriceUpdate}
        onStatusToggle={handleStatusToggle}
        onQuickAdjust={handleQuickAdjust}
        onOpenCustomAdjust={(item) => {
          setAdjustModalItem(item);
          setCustomDelta(5);
          setCustomReason('manual_restock');
          setCustomNote('');
        }}
        onToggleVariantAudit={(variantId) =>
          setSelectedVariantAuditId(selectedVariantAuditId === variantId ? null : variantId)
        }
      />

      {/* Custom Stock Adjustment Dialog */}
      <StockAdjustDialog
        item={adjustModalItem}
        customDelta={customDelta}
        customReason={customReason}
        customNote={customNote}
        isLoading={isLoading}
        onClose={() => setAdjustModalItem(null)}
        onDeltaChange={setCustomDelta}
        onReasonChange={setCustomReason}
        onNoteChange={setCustomNote}
        onConfirm={() => {
          if (adjustModalItem) {
            handleQuickAdjust(adjustModalItem.variantId, customDelta, customReason, customNote);
          }
        }}
      />

      {/* Audit Log Timeline Section */}
      <InventoryAuditTimeline
        auditLogs={auditLogs}
        selectedVariantAuditId={selectedVariantAuditId}
        items={items}
        onClearVariantFilter={() => setSelectedVariantAuditId(null)}
      />
    </div>
  );
}
