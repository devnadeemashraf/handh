import { z } from 'zod';

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const storefrontThemeSchema = z.object({
  background: z
    .string()
    .regex(hexColorRegex, 'Background must be a valid hex color')
    .default('#FDFBF7'),
  surface: z.string().regex(hexColorRegex, 'Surface must be a valid hex color').default('#FFFFFF'),
  border: z.string().regex(hexColorRegex, 'Border must be a valid hex color').default('#EBE7DF'),
  primaryEmerald: z
    .string()
    .regex(hexColorRegex, 'Primary emerald must be a valid hex color')
    .default('#0A2E24'),
  primaryEmeraldHover: z
    .string()
    .regex(hexColorRegex, 'Hover color must be a valid hex color')
    .default('#07221A'),
  accentGold: z
    .string()
    .regex(hexColorRegex, 'Accent gold must be a valid hex color')
    .default('#C5A880'),
  accentGoldLight: z
    .string()
    .regex(hexColorRegex, 'Light gold accent must be a valid hex color')
    .default('#F5EFE6'),
  textPrimary: z
    .string()
    .regex(hexColorRegex, 'Primary text must be a valid hex color')
    .default('#171A19'),
  textSecondary: z
    .string()
    .regex(hexColorRegex, 'Secondary text must be a valid hex color')
    .default('#5C6460')
});

export const storefrontHeroSchema = z.object({
  eyebrow: z.string().default('H&H Signature Collection'),
  title: z.string().default('Crafted for Grace & Modesty'),
  subtitle: z
    .string()
    .default(
      'Exquisite handcrafted nose-pieces and accessories designed for refined everyday elegance.'
    ),
  ctaText: z.string().default('Explore the Collection'),
  ctaLink: z.string().default('#catalog'),
  badgeText: z.string().optional(),
  variant: z.enum(['luxury', 'split', 'minimal']).default('luxury'),
  ctaVariant: z.enum(['default', 'gold', 'outline']).default('default'),
  alignment: z.enum(['left', 'center']).default('center')
});

export const storefrontAnnouncementSchema = z.object({
  enabled: z.boolean().default(true),
  text: z
    .string()
    .default(
      'Handcrafted in limited batches • Express courier dispatch across India via India Post & DTDC'
    ),
  badge: z.string().default('Signature Drop'),
  link: z.string().optional(),
  variant: z.enum(['default', 'emerald', 'gold', 'subtle']).default('default'),
  badgeVariant: z.enum(['default', 'secondary', 'outline', 'gold']).default('gold')
});

export const storefrontReassuranceSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.enum(['sparkles', 'truck', 'shield', 'clock']).default('sparkles'),
  cardStyle: z.enum(['default', 'card', 'outline']).default('default')
});

export const storefrontConfigSchema = z.object({
  theme: storefrontThemeSchema.default({}),
  hero: storefrontHeroSchema.default({}),
  announcement: storefrontAnnouncementSchema.default({}),
  reassurances: z.array(storefrontReassuranceSchema).default([
    {
      icon: 'sparkles',
      title: 'Artisanal Craftsmanship',
      description: 'Meticulously shaped in limited quantities for unmatched grace.',
      cardStyle: 'default'
    },
    {
      icon: 'truck',
      title: 'Direct Courier Dispatch',
      description: 'Carefully packaged and shipped with verifiable tracking.',
      cardStyle: 'default'
    },
    {
      icon: 'shield',
      title: 'Secure Online Payments',
      description: 'End-to-end encrypted checkout powered by Razorpay.',
      cardStyle: 'default'
    }
  ])
});

export type StorefrontTheme = z.infer<typeof storefrontThemeSchema>;
export type StorefrontHero = z.infer<typeof storefrontHeroSchema>;
export type StorefrontAnnouncement = z.infer<typeof storefrontAnnouncementSchema>;
export type StorefrontReassurance = z.infer<typeof storefrontReassuranceSchema>;
export type StorefrontConfig = z.infer<typeof storefrontConfigSchema>;

export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = storefrontConfigSchema.parse({});

/**
 * Resolves a partial or raw settings object into a complete, safe StorefrontConfig.
 */
export function resolveStorefrontConfig(rawConfig?: unknown): StorefrontConfig {
  const result = storefrontConfigSchema.safeParse(rawConfig ?? {});
  if (result.success) {
    return result.data;
  }
  return DEFAULT_STOREFRONT_CONFIG;
}

/**
 * Converts a hex color string (#RRGGBB or #RGB) into an HSL string triplet ("H S% L%").
 * Used for dynamic CSS variable injection compatible with Tailwind and shadcn/ui.
 */
export function hexToHsl(hex: string): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
