export interface InvoiceTemplateConfig {
  brandName: string;
  legalName?: string | undefined;
  tagline?: string | undefined;
  gstin?: string | undefined;
  pan?: string | undefined;
  addressLine1: string;
  addressLine2?: string | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  supportEmail: string;
  supportPhone: string;
  footerNote: string;
  invoicePrefix: string;
  showGstBreakdown: boolean;
}

export interface InvoiceItem {
  title: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentId?: string | undefined;
  fulfillmentStatus: string;
  trackingNumber?: string | undefined;
  courierName?: string | undefined;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string | undefined;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  items: InvoiceItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  discountMinor: number;
  totalAmountMinor: number;
  taxMinor?: number | undefined;
  cgstMinor?: number | undefined;
  sgstMinor?: number | undefined;
  igstMinor?: number | undefined;
  taxableAmountMinor?: number | undefined;
  template: InvoiceTemplateConfig;
}
