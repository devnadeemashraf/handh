import { z } from 'zod';

export interface OrderAttribution {
  source: string;
  medium?: string | undefined;
  campaign?: string | undefined;
  content?: string | undefined;
  term?: string | undefined;
  referrer?: string | undefined;
  landingPage?: string | undefined;
  influencerCode?: string | undefined;
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown' | undefined;
  capturedAt: string;
}

export const orderAttributionSchema = z.object({
  source: z.string().min(1).default('direct'),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  content: z.string().optional(),
  term: z.string().optional(),
  referrer: z.string().optional(),
  landingPage: z.string().optional(),
  influencerCode: z.string().optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'unknown']).optional().default('unknown'),
  capturedAt: z.string().datetime().default(() => new Date().toISOString())
});

export type AnalyticsEventType =
  | 'page_viewed'
  | 'product_viewed'
  | 'customization_configured'
  | 'cart_item_added'
  | 'cart_item_removed'
  | 'checkout_started'
  | 'coupon_applied'
  | 'payment_initiated'
  | 'payment_succeeded'
  | 'order_completed';

export interface BaseEventProperties {
  path?: string;
  referrer?: string;
  timestamp?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ProductViewEventProperties extends BaseEventProperties {
  productId: string;
  slug: string;
  title: string;
  category?: string;
  department?: string;
  startingPriceMinor: number;
}

export interface CustomizationConfiguredEventProperties extends BaseEventProperties {
  productId: string;
  productTitle: string;
  customText?: string;
  hasUploadedArtwork: boolean;
  surchargeMinor: number;
}

export interface CartEventProperties extends BaseEventProperties {
  sku: string;
  productId: string;
  title: string;
  priceMinor: number;
  quantity: number;
  isCustomized?: boolean;
}

export interface CheckoutEventProperties extends BaseEventProperties {
  cartItemCount: number;
  subtotalMinor: number;
  couponCode?: string;
  discountMinor?: number;
  totalMinor: number;
}

export interface OrderCompletedEventProperties extends BaseEventProperties {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  currency: string;
  paymentMethod?: string;
  itemCount: number;
  attribution?: OrderAttribution;
}

export type AnalyticsEventPayload =
  | { type: 'page_viewed'; properties: BaseEventProperties }
  | { type: 'product_viewed'; properties: ProductViewEventProperties }
  | { type: 'customization_configured'; properties: CustomizationConfiguredEventProperties }
  | { type: 'cart_item_added'; properties: CartEventProperties }
  | { type: 'cart_item_removed'; properties: CartEventProperties }
  | { type: 'checkout_started'; properties: CheckoutEventProperties }
  | { type: 'coupon_applied'; properties: { code: string; discountMinor: number } }
  | { type: 'payment_initiated'; properties: CheckoutEventProperties }
  | { type: 'payment_succeeded'; properties: OrderCompletedEventProperties }
  | { type: 'order_completed'; properties: OrderCompletedEventProperties };

export interface AttributionChannelSummary {
  source: string;
  orderCount: number;
  revenueMinor: number;
  averageOrderValueMinor: number;
}
