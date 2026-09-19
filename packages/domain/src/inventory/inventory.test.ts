import { describe, it, expect } from 'vitest';
import {
  StockAdjustmentSchema,
  UpdateVariantPriceSchema,
  UpdateProductStatusSchema
} from './validation';

describe('Inventory Domain Validations', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  describe('StockAdjustmentSchema', () => {
    it('accepts valid positive restock adjustment', () => {
      const result = StockAdjustmentSchema.safeParse({
        variantId: validUuid,
        delta: 10,
        reason: 'manual_restock',
        note: 'Fresh batch received from silversmith'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.delta).toBe(10);
        expect(result.data.reason).toBe('manual_restock');
      }
    });

    it('accepts valid negative adjustment for damaged goods', () => {
      const result = StockAdjustmentSchema.safeParse({
        variantId: validUuid,
        delta: -2,
        reason: 'damaged'
      });

      expect(result.success).toBe(true);
    });

    it('rejects zero delta adjustment', () => {
      const result = StockAdjustmentSchema.safeParse({
        variantId: validUuid,
        delta: 0,
        reason: 'manual_correction'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/cannot be zero/i);
      }
    });

    it('rejects invalid variant UUID', () => {
      const result = StockAdjustmentSchema.safeParse({
        variantId: 'not-a-uuid',
        delta: 5,
        reason: 'manual_restock'
      });

      expect(result.success).toBe(false);
    });

    it('rejects invalid reason', () => {
      const result = StockAdjustmentSchema.safeParse({
        variantId: validUuid,
        delta: 5,
        reason: 'unauthorized_reason'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateVariantPriceSchema', () => {
    it('accepts valid positive price in minor units', () => {
      const result = UpdateVariantPriceSchema.safeParse({
        variantId: validUuid,
        priceMinor: 49900 // ₹499.00
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceMinor).toBe(49900);
      }
    });

    it('accepts zero price (e.g. promotional gift)', () => {
      const result = UpdateVariantPriceSchema.safeParse({
        variantId: validUuid,
        priceMinor: 0
      });

      expect(result.success).toBe(true);
    });

    it('rejects negative price', () => {
      const result = UpdateVariantPriceSchema.safeParse({
        variantId: validUuid,
        priceMinor: -500
      });

      expect(result.success).toBe(false);
    });

    it('rejects non-integer price', () => {
      const result = UpdateVariantPriceSchema.safeParse({
        variantId: validUuid,
        priceMinor: 499.5
      });

      expect(result.success).toBe(false);
    });
  });

  describe('UpdateProductStatusSchema', () => {
    it('accepts valid product statuses', () => {
      for (const status of ['draft', 'published', 'archived'] as const) {
        const result = UpdateProductStatusSchema.safeParse({
          productId: validUuid,
          status
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid product status', () => {
      const result = UpdateProductStatusSchema.safeParse({
        productId: validUuid,
        status: 'deleted'
      });
      expect(result.success).toBe(false);
    });
  });
});
