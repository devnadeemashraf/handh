export type InventoryAuditReason =
  | 'manual_restock'
  | 'manual_correction'
  | 'damaged'
  | 'order_captured'
  | 'order_cancelled'
  | 'initial_seed';

export interface StockAdjustmentInput {
  variantId: string;
  delta: number;
  reason: InventoryAuditReason;
  note?: string | undefined;
}

export interface UpdateVariantPriceInput {
  variantId: string;
  priceMinor: number;
}

export interface UpdateProductStatusInput {
  productId: string;
  status: 'draft' | 'published' | 'archived';
}

export interface AdminInventoryItem {
  productId: string;
  productTitle: string;
  productSlug: string;
  productStatus: 'draft' | 'published' | 'archived';
  variantId: string;
  variantSku: string;
  variantTitle: string;
  priceMinor: number;
  compareAtPriceMinor?: number | undefined;
  currency: string;
  onHand: number;
  reserved: number;
  available: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  primaryImageUrl?: string | null | undefined;
  updatedAt: string;
}

export interface InventoryAuditLogItem {
  id: string;
  variantId: string;
  variantSku: string;
  productTitle: string;
  previousOnHand: number;
  newOnHand: number;
  delta: number;
  reason: InventoryAuditReason;
  note?: string | null | undefined;
  createdAt: string;
}

export interface AdminInventorySummary {
  totalVariants: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  lowStockCount: number;
  outOfStockCount: number;
}
