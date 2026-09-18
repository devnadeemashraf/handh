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
  badgeText: z.string().optional()
});

export const storefrontAnnouncementSchema = z.object({
  enabled: z.boolean().default(true),
  text: z
    .string()
    .default(
      'Handcrafted in limited batches • Express courier dispatch across India via India Post & DTDC'
    ),
  badge: z.string().default('Signature Drop'),
  link: z.string().optional()
});

export const storefrontReassuranceSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.enum(['sparkles', 'truck', 'shield', 'clock']).default('sparkles')
});

export const storefrontConfigSchema = z.object({
  theme: storefrontThemeSchema.default({}),
  hero: storefrontHeroSchema.default({}),
  announcement: storefrontAnnouncementSchema.default({}),
  reassurances: z.array(storefrontReassuranceSchema).default([
    {
      icon: 'sparkles',
      title: 'Artisanal Craftsmanship',
      description: 'Meticulously shaped in limited quantities for unmatched grace.'
    },
    {
      icon: 'truck',
      title: 'Direct Courier Dispatch',
      description: 'Carefully packaged and shipped with verifiable tracking.'
    },
    {
      icon: 'shield',
      title: 'Secure Online Payments',
      description: 'End-to-end encrypted checkout powered by Razorpay.'
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
