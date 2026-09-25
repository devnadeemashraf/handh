import type { OrderAttribution } from '@hh/domain';

import { getAnalyticsProvider } from './provider';

export function trackPageView(path?: string, title?: string): void {
  const provider = getAnalyticsProvider();
  provider.page(path, {
    title: title ?? (typeof document !== 'undefined' ? document.title : '')
  });
}

export function trackProductView(params: {
  productId: string;
  productName: string;
  priceMinor: number;
  categoryName?: string | undefined;
}): void {
  const provider = getAnalyticsProvider();
  provider.track('product_viewed', {
    product_id: params.productId,
    product_name: params.productName,
    price: params.priceMinor / 100,
    category: params.categoryName
  });
}

export function trackAddToCart(params: {
  productId: string;
  variantId: string;
  productName: string;
  quantity: number;
  priceMinor: number;
}): void {
  const provider = getAnalyticsProvider();
  provider.track('cart_item_added', {
    product_id: params.productId,
    variant_id: params.variantId,
    product_name: params.productName,
    quantity: params.quantity,
    price: params.priceMinor / 100
  });
}

export function trackCheckoutInitiated(params: {
  cartItemCount: number;
  cartTotalMinor: number;
  couponCode?: string;
  attribution?: OrderAttribution | null;
}): void {
  const provider = getAnalyticsProvider();
  provider.track('checkout_initiated', {
    item_count: params.cartItemCount,
    total_amount: params.cartTotalMinor / 100,
    coupon_code: params.couponCode,
    attribution_source: params.attribution?.source,
    attribution_medium: params.attribution?.medium,
    attribution_campaign: params.attribution?.campaign
  });
}

export function trackError(params: {
  errorType: string;
  errorMessage: string;
  context?: string | undefined;
  errorCode?: string | number | undefined;
}): void {
  const provider = getAnalyticsProvider();
  provider.track('client_error', {
    error_type: params.errorType,
    error_message: params.errorMessage,
    context: params.context,
    error_code: params.errorCode
  });
}

export function trackOrderCompleted(params: {
  orderId: string;
  orderNumber: string;
  totalMinor: number;
  paymentMethod: string;
  itemCount: number;
  attribution?: OrderAttribution | null;
}): void {
  const provider = getAnalyticsProvider();
  provider.track('order_completed', {
    order_id: params.orderId,
    order_number: params.orderNumber,
    revenue: params.totalMinor / 100,
    payment_method: params.paymentMethod,
    item_count: params.itemCount,
    attribution_source: params.attribution?.source,
    attribution_medium: params.attribution?.medium,
    attribution_campaign: params.attribution?.campaign,
    influencer_code: params.attribution?.influencerCode
  });
}
