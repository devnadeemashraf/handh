import { describe, expect, it } from 'vitest';

import {
  deepMerge,
  DEFAULT_STOREFRONT_CONFIG,
  hexToHsl,
  resolveStorefrontConfig,
  safeStorefrontUrlSchema,
  storefrontConfigSchema
} from './storefront-config';

describe('Storefront Config & SDUI Domain (E-COM-134, E-COM-136, E-COM-139)', () => {
  describe('deepMerge utility (E-COM-134)', () => {
    it('preserves sibling fields when merging nested objects', () => {
      const target = {
        hero: {
          title: 'Original Title',
          subtitle: 'Original Subtitle',
          ctaLink: '#catalog'
        },
        theme: {
          primaryEmerald: '#0A2E24',
          accentGold: '#C5A880'
        }
      };

      const patch = {
        hero: {
          title: 'Updated Headline Only'
        }
      };

      const merged = deepMerge(target, patch);

      expect(merged.hero.title).toBe('Updated Headline Only');
      // Sibling fields are preserved
      expect(merged.hero.subtitle).toBe('Original Subtitle');
      expect(merged.hero.ctaLink).toBe('#catalog');
      expect(merged.theme.primaryEmerald).toBe('#0A2E24');
    });

    it('handles null and undefined sources safely', () => {
      const target = { a: 1, b: { c: 2 } };
      expect(deepMerge(target, null)).toEqual(target);
      expect(deepMerge(target, undefined)).toEqual(target);
    });

    it('overwrites primitive values with source values', () => {
      const target = { enabled: true, count: 5 };
      const source = { enabled: false, count: 10 };
      expect(deepMerge(target, source)).toEqual({ enabled: false, count: 10 });
    });
  });

  describe('safeStorefrontUrlSchema (E-COM-136)', () => {
    it('accepts relative paths and anchor hashes', () => {
      expect(safeStorefrontUrlSchema.safeParse('/collections/signature').success).toBe(true);
      expect(safeStorefrontUrlSchema.safeParse('#catalog').success).toBe(true);
      expect(safeStorefrontUrlSchema.safeParse('/products/royal-polki').success).toBe(true);
    });

    it('accepts valid HTTPS URLs', () => {
      expect(safeStorefrontUrlSchema.safeParse('https://instagram.com/handh').success).toBe(true);
      expect(safeStorefrontUrlSchema.safeParse('https://handh.in').success).toBe(true);
    });

    it('rejects unsafe URL protocols and XSS vectors', () => {
      expect(safeStorefrontUrlSchema.safeParse('javascript:alert(document.cookie)').success).toBe(
        false
      );
      expect(
        safeStorefrontUrlSchema.safeParse('data:text/html,<script>alert(1)</script>').success
      ).toBe(false);
      expect(safeStorefrontUrlSchema.safeParse('vbscript:msgbox(1)').success).toBe(false);
      expect(safeStorefrontUrlSchema.safeParse('http://insecure.com').success).toBe(false);
    });

    it('validates URLs inside hero and announcement schemas', () => {
      const maliciousConfig = {
        hero: {
          ctaLink: 'javascript:evil()'
        }
      };
      expect(storefrontConfigSchema.deepPartial().safeParse(maliciousConfig).success).toBe(false);

      const validConfig = {
        hero: {
          ctaLink: '/products/bridal'
        }
      };
      expect(storefrontConfigSchema.deepPartial().safeParse(validConfig).success).toBe(true);
    });
  });

  describe('resolveStorefrontConfig section-level fallback resilience (E-COM-139)', () => {
    it('returns default storefront configuration when raw config is empty or invalid', () => {
      expect(resolveStorefrontConfig(null)).toEqual(DEFAULT_STOREFRONT_CONFIG);
      expect(resolveStorefrontConfig(undefined)).toEqual(DEFAULT_STOREFRONT_CONFIG);
      expect(resolveStorefrontConfig('not an object')).toEqual(DEFAULT_STOREFRONT_CONFIG);
    });

    it('preserves valid sections when another section contains corrupted data', () => {
      const corruptedInput = {
        theme: {
          primaryEmerald: 'NOT_A_HEX_COLOR' // Invalid hex
        },
        hero: {
          title: 'Custom Curated Luxury',
          subtitle: 'Valid Custom Subtitle',
          ctaText: 'Shop Now',
          ctaLink: '/shop'
        },
        announcement: {
          enabled: true,
          text: 'Valid Festive Announcement',
          badge: 'Exclusive'
        }
      };

      const resolved = resolveStorefrontConfig(corruptedInput);

      // Corrupted theme should fall back to default
      expect(resolved.theme.primaryEmerald).toBe(DEFAULT_STOREFRONT_CONFIG.theme.primaryEmerald);

      // Valid hero and announcement must be completely preserved!
      expect(resolved.hero.title).toBe('Custom Curated Luxury');
      expect(resolved.hero.subtitle).toBe('Valid Custom Subtitle');
      expect(resolved.announcement.text).toBe('Valid Festive Announcement');
      expect(resolved.announcement.badge).toBe('Exclusive');
    });

    it('preserves valid custom configuration completely', () => {
      const customConfig = {
        theme: {
          ...DEFAULT_STOREFRONT_CONFIG.theme,
          primaryEmerald: '#123456'
        },
        hero: {
          ...DEFAULT_STOREFRONT_CONFIG.hero,
          title: 'Bespoke Bridal Elegance'
        },
        announcement: {
          ...DEFAULT_STOREFRONT_CONFIG.announcement,
          text: 'Autumn Sale Live'
        },
        reassurances: DEFAULT_STOREFRONT_CONFIG.reassurances
      };

      const resolved = resolveStorefrontConfig(customConfig);
      expect(resolved.theme.primaryEmerald).toBe('#123456');
      expect(resolved.hero.title).toBe('Bespoke Bridal Elegance');
      expect(resolved.announcement.text).toBe('Autumn Sale Live');
    });
  });

  describe('hexToHsl utility', () => {
    it('converts 6-digit hex colors to HSL triplets', () => {
      expect(hexToHsl('#FFFFFF')).toBe('0 0% 100%');
      expect(hexToHsl('#000000')).toBe('0 0% 0%');
      expect(hexToHsl('#0A2E24')).toMatch(/^\d+\s+\d+%\s+\d+%/);
    });

    it('converts 3-digit shorthand hex colors', () => {
      expect(hexToHsl('#FFF')).toBe('0 0% 100%');
      expect(hexToHsl('#000')).toBe('0 0% 0%');
    });
  });
});
