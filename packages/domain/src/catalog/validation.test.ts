import { describe, it, expect } from 'vitest';
import {
  createStoreSchema,
  createCategorySchema,
  createProductSchema,
  slugSchema
} from './validation';

describe('Catalog Domain Validation', () => {
  describe('slugSchema', () => {
    it('accepts clean URL-friendly slugs', () => {
      expect(slugSchema.safeParse('accessories').success).toBe(true);
      expect(slugSchema.safeParse('modest-wear').success).toBe(true);
      expect(slugSchema.safeParse('nose-piece-gold-01').success).toBe(true);
    });

    it('rejects reserved system route slugs', () => {
      expect(slugSchema.safeParse('admin').success).toBe(false);
      expect(slugSchema.safeParse('checkout').success).toBe(false);
      expect(slugSchema.safeParse('api').success).toBe(false);
      expect(slugSchema.safeParse('track').success).toBe(false);
    });

    it('rejects slugs with uppercase or special characters', () => {
      expect(slugSchema.safeParse('Accessories').success).toBe(false);
      expect(slugSchema.safeParse('nose_piece').success).toBe(false);
      expect(slugSchema.safeParse('nose piece').success).toBe(false);
    });
  });

  describe('createProductSchema', () => {
    const validProductInput = {
      storeId: '00000000-0000-0000-0000-000000000001',
      slug: 'pearl-glow-nose-piece',
      title: 'Pearl Glow Nose Piece',
      description: 'Handcrafted pearl nose piece.',
      status: 'published' as const,
      variants: [
        {
          sku: 'HH-ACC-NP-01',
          title: 'Default',
          priceMinor: 59900,
          currency: 'INR' as const,
          initialQuantity: 5
        }
      ],
      images: [
        {
          storageKey: 'products/np-01.jpg',
          url: 'https://images.handh.local/np-01.jpg',
          altText: 'Pearl Glow Nose Piece'
        }
      ]
    };

    it('validates a complete valid product input', () => {
      const result = createProductSchema.safeParse(validProductInput);
      expect(result.success).toBe(true);
    });

    it('rejects products without at least one variant', () => {
      const invalid = { ...validProductInput, variants: [] };
      const result = createProductSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects variants with negative or float prices', () => {
      const negativePrice = {
        ...validProductInput,
        variants: [{ ...validProductInput.variants[0]!, priceMinor: -500 }]
      };
      expect(createProductSchema.safeParse(negativePrice).success).toBe(false);

      const floatPrice = {
        ...validProductInput,
        variants: [{ ...validProductInput.variants[0]!, priceMinor: 599.5 }]
      };
      expect(createProductSchema.safeParse(floatPrice).success).toBe(false);
    });
  });

  describe('createStoreSchema and createCategorySchema', () => {
    it('validates store creation', () => {
      const store = {
        slug: 'hh',
        name: 'H&H',
        defaultCurrency: 'INR' as const
      };
      expect(createStoreSchema.safeParse(store).success).toBe(true);
    });

    it('validates category creation with store reference', () => {
      const category = {
        storeId: '00000000-0000-0000-0000-000000000001',
        slug: 'accessories',
        name: 'Accessories'
      };
      expect(createCategorySchema.safeParse(category).success).toBe(true);
    });
  });
});
