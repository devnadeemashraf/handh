export type NotificationChannel = 'email' | 'whatsapp';

export type NotificationEventName = 'order.paid' | 'order.dispatched' | 'order.delivered';

export interface OrderItemSnapshotItem {
  title: string;
  variantTitle?: string | undefined;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
}

export interface ShippingAddressSnapshot {
  recipientName: string;
  line1: string;
  line2?: string | null | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string | undefined;
}

export interface OrderPaidPayload {
  orderId: string;
  storeId?: string | undefined;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalMinor: number;
  currency: string;
  itemsSnapshot: OrderItemSnapshotItem[];
  shippingAddressSnapshot: ShippingAddressSnapshot;
  userId?: string | null | undefined;
  paidAt: string;
  whatsappOptIn?: boolean | undefined;
}

export interface OrderDispatchedPayload {
  orderId: string;
  orderNumber: string;
  courierProvider: string;
  trackingNumber: string;
  trackingReference: string;
  shippingProviderId?: string | undefined;
  labelUrl?: string | null | undefined;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  userId?: string | null | undefined;
  shippedAt: string;
  whatsappOptIn?: boolean | undefined;
}

export interface OrderDeliveredPayload {
  orderId: string;
  orderNumber: string;
  fulfillmentId?: string | undefined;
  awb: string;
  providerId?: string | undefined;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | undefined;
  userId?: string | null | undefined;
  deliveredAt: string;
  whatsappOptIn?: boolean | undefined;
}

// ── Email Job Data ─────────────────────────────────────────────────────────────

export interface OrderConfirmationEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalMinor: number;
  currency?: string | undefined;
  items: OrderItemSnapshotItem[];
  shippingAddress: ShippingAddressSnapshot;
  orderUrl?: string | undefined;
}

export interface OrderDispatchedEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  courierName: string;
  trackingNumber: string;
  trackingReference?: string | undefined;
  trackingUrl?: string | undefined;
  shippedAt: string;
}

export interface OrderDeliveredEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  deliveredAt: string;
  orderUrl?: string | undefined;
}

export interface AdminOrderAlertEmailData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalMinor: number;
  currency?: string | undefined;
  items: OrderItemSnapshotItem[];
  shippingAddress: ShippingAddressSnapshot;
  adminOrderUrl?: string | undefined;
}

// ── WhatsApp Job Data ──────────────────────────────────────────────────────────

export interface OrderConfirmationWhatsAppData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  totalMinor: number;
  currency?: string | undefined;
  itemCount: number;
  trackingUrl?: string | undefined;
}

export interface OrderDispatchedWhatsAppData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string | undefined;
}

export interface OrderDeliveredWhatsAppData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  deliveredAt: string;
}

// ── Output Render Types ───────────────────────────────────────────────────────

export interface EmailRenderOutput {
  subject: string;
  html: string;
  text: string;
}

export interface WhatsAppTemplateComponentParameter {
  type: 'text';
  text: string;
}

export interface WhatsAppTemplateComponent {
  type: 'body' | 'header' | 'button';
  sub_type?: string | undefined;
  index?: string | undefined;
  parameters: WhatsAppTemplateComponentParameter[];
}

export interface WhatsAppTemplatePayload {
  name: string;
  language: { code: string };
  components?: WhatsAppTemplateComponent[] | undefined;
}

export interface WhatsAppRenderOutput {
  text: string;
  template?: WhatsAppTemplatePayload | undefined;
}
