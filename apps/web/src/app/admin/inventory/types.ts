import type {
  AdminInventoryItem,
  AdminInventorySummary,
  InventoryAuditLogItem,
  InventoryAuditReason
} from '@hh/domain';

export type FilterTab = 'all' | 'needs_restock' | 'published' | 'drafts';

export interface InventoryManagerProps {
  initialItems: AdminInventoryItem[];
  initialSummary: AdminInventorySummary;
  initialAuditLogs: InventoryAuditLogItem[];
}

export interface StockAdjustModalState {
  item: AdminInventoryItem;
  delta: number;
  reason: InventoryAuditReason;
  note: string;
}
