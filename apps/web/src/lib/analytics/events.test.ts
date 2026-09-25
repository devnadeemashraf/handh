import { beforeEach, describe, expect, it, vi } from 'vitest';

import { trackAddToCart, trackError, trackProductView } from './events';
import { getAnalyticsProvider, resetAnalyticsProvider } from './provider';

describe('Analytics Events (E-COM-110, E-COM-111)', () => {
  beforeEach(() => {
    resetAnalyticsProvider();
    vi.clearAllMocks();
  });

  describe('trackProductView', () => {
    it('fires product_viewed event with correct properties', () => {
      const provider = getAnalyticsProvider();
      const trackSpy = vi.spyOn(provider, 'track').mockImplementation(() => {});

      trackProductView({
        productId: 'prod_abc',
        productName: 'Luxury Abaya',
        priceMinor: 450000,
        categoryName: 'Abayas'
      });

      expect(trackSpy).toHaveBeenCalledWith('product_viewed', {
        product_id: 'prod_abc',
        product_name: 'Luxury Abaya',
        price: 4500,
        category: 'Abayas'
      });
    });
  });

  describe('trackAddToCart', () => {
    it('fires cart_item_added event with quantity and price', () => {
      const provider = getAnalyticsProvider();
      const trackSpy = vi.spyOn(provider, 'track').mockImplementation(() => {});

      trackAddToCart({
        productId: 'prod_xyz',
        variantId: 'var_001',
        productName: 'Embroidered Kaftan',
        quantity: 2,
        priceMinor: 120000
      });

      expect(trackSpy).toHaveBeenCalledWith('cart_item_added', {
        product_id: 'prod_xyz',
        variant_id: 'var_001',
        product_name: 'Embroidered Kaftan',
        quantity: 2,
        price: 1200
      });
    });
  });

  describe('trackError', () => {
    it('fires client_error event with all fields', () => {
      const provider = getAnalyticsProvider();
      const trackSpy = vi.spyOn(provider, 'track').mockImplementation(() => {});

      trackError({
        errorType: 'checkout_failed',
        errorMessage: 'Payment gateway timeout',
        context: 'CheckoutPage',
        errorCode: 504
      });

      expect(trackSpy).toHaveBeenCalledWith('client_error', {
        error_type: 'checkout_failed',
        error_message: 'Payment gateway timeout',
        context: 'CheckoutPage',
        error_code: 504
      });
    });

    it('fires client_error event with optional fields omitted', () => {
      const provider = getAnalyticsProvider();
      const trackSpy = vi.spyOn(provider, 'track').mockImplementation(() => {});

      trackError({
        errorType: 'hydration_mismatch',
        errorMessage: 'Text content mismatch'
      });

      expect(trackSpy).toHaveBeenCalledWith('client_error', {
        error_type: 'hydration_mismatch',
        error_message: 'Text content mismatch',
        context: undefined,
        error_code: undefined
      });
    });
  });
});
