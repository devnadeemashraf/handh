export type InsightTimeframe = 'today' | 'week' | 'month' | 'all';

export interface SalesVolumeScorecard {
  revenueMinor: number;
  orderCount: number;
  aovMinor: number;
  pendingFulfillmentCount: number;
}

export interface CustomerFrequencyRecord {
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  orderCount: number;
  totalSpendMinor: number;
  firstOrderAt: string;
  lastOrderAt: string;
  isRepeatCustomer: boolean;
}

export interface CustomerMetrics {
  totalCustomers: number;
  repeatCustomers: number;
  repeatRatePercentage: number;
  topCustomers: CustomerFrequencyRecord[];
}

export interface ProductVelocityRecord {
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  unitsSold: number;
  revenueMinor: number;
  currentStock: number;
}

export interface ExecutiveInsightsData {
  timeframe: InsightTimeframe;
  sales: SalesVolumeScorecard;
  customers: CustomerMetrics;
  productVelocity: ProductVelocityRecord[];
}
