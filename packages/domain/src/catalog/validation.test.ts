import { describe, expect, it } from 'vitest';

import { hexToHsl, resolveStorefrontConfig, storefrontConfigSchema } from './storefront-config';
import {
  createCategorySchema,
  createProductSchema,
  createStoreSchema,
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

    it('validates Legal Metrology statutory defaults and custom overrides', () => {
      const parsedDefault = createProductSchema.parse(validProductInput);
      expect(parsedDefault.countryOfOrigin).toBe('India');
      expect(parsedDefault.netQuantity).toBe('1 N');

      const customInput = {
        ...validProductInput,
        countryOfOrigin: 'India',
        netQuantity: '2 N (Set of 2)',
        commodityName: 'Handcrafted Nose Pin',
        manufacturerName: 'H&H Luxury Modest Wear Private Limited',
        manufacturerAddress: 'Hyderabad, Telangana 500034',
        packerName: 'H&H Logistics Hub',
        packerAddress: 'Hyderabad, Telangana 500034'
      };

      const parsedCustom = createProductSchema.parse(customInput);
      expect(parsedCustom.countryOfOrigin).toBe('India');
      expect(parsedCustom.netQuantity).toBe('2 N (Set of 2)');
      expect(parsedCustom.commodityName).toBe('Handcrafted Nose Pin');
      expect(parsedCustom.manufacturerName).toBe('H&H Luxury Modest Wear Private Limited');
      expect(parsedCustom.packerName).toBe('H&H Logistics Hub');
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

  describe('storefrontConfigSchema & hexToHsl', () => {
    it('converts hex colors accurately to HSL space', () => {
      expect(hexToHsl('#0A2E24')).toBe('163 64% 11%');
      expect(hexToHsl('#FDFBF7')).toBe('40 60% 98%');
      expect(hexToHsl('#FFFFFF')).toBe('0 0% 100%');
      expect(hexToHsl('#000000')).toBe('0 0% 0%');
    });

    it('resolves safe defaults for storefront config', () => {
      const config = resolveStorefrontConfig({});
      expect(config.hero.variant).toBe('luxury');
      expect(config.hero.ctaVariant).toBe('default');
      expect(config.hero.alignment).toBe('center');
      expect(config.announcement.variant).toBe('default');
      expect(config.announcement.badgeVariant).toBe('gold');
      expect(config.reassurances[0]?.cardStyle).toBe('default');
    });

    it('parses custom hero and announcement variants cleanly', () => {
      const parsed = storefrontConfigSchema.parse({
        hero: {
          variant: 'split',
          ctaVariant: 'gold',
          alignment: 'left'
        },
        announcement: {
          variant: 'emerald',
          badgeVariant: 'secondary'
        }
      });
      expect(parsed.hero.variant).toBe('split');
      expect(parsed.hero.ctaVariant).toBe('gold');
      expect(parsed.hero.alignment).toBe('left');
      expect(parsed.announcement.variant).toBe('emerald');
      expect(parsed.announcement.badgeVariant).toBe('secondary');
    });
  });
});
