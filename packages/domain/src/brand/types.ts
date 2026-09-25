import { z } from 'zod';

const hexColorRegex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const BrandAddressSchema = z.object({
  street: z.string().default('Plot No. 128, Road No. 36, Jubilee Hills'),
  city: z.string().default('Hyderabad'),
  state: z.string().default('Telangana'),
  postalCode: z.string().default('500034'),
  country: z.string().default('India'),
  fullFormatted: z
    .string()
    .default('Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India')
});

export const BrandGrievanceOfficerSchema = z.object({
  name: z.string().default('Mohammed Irfan'),
  designation: z.string().default('Head of Customer Experience & Grievance Officer'),
  email: z.string().email().default('grievance@handh.in'),
  phone: z.string().default('+91 40 2355 7890'),
  address: z
    .string()
    .default('Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India'),
  workingHours: z.string().default('Monday – Friday, 10:00 AM – 6:00 PM IST'),
  acknowledgementSla: z.string().default('Within 48 hours of complaint receipt'),
  resolutionSla: z.string().default('Within 30 calendar days from receipt')
});

export const BrandThemeSchema = z.object({
  background: z.string().regex(hexColorRegex).default('#FDFBF7'),
  surface: z.string().regex(hexColorRegex).default('#FFFFFF'),
  border: z.string().regex(hexColorRegex).default('#EBE7DF'),
  primaryEmerald: z.string().regex(hexColorRegex).default('#0A2E24'),
  primaryEmeraldHover: z.string().regex(hexColorRegex).default('#07221A'),
  accentGold: z.string().regex(hexColorRegex).default('#C5A880'),
  accentGoldLight: z.string().regex(hexColorRegex).default('#F5EFE6'),
  textPrimary: z.string().regex(hexColorRegex).default('#171A19'),
  textSecondary: z.string().regex(hexColorRegex).default('#5C6460')
});

export const BrandIdentitySchema = z.object({
  /** Primary public brand name (e.g. "H&H") */
  name: z.string().min(1, 'Brand name is required').default('H&H'),

  /** Registered legal corporate entity (e.g. "H&H Luxury Modest Wear Private Limited") */
  legalName: z
    .string()
    .min(1, 'Legal company name is required')
    .default('H&H Luxury Modest Wear Private Limited'),

  /** Abbreviated/compact brand code for mobile nav, badges, and PWA icon labels (e.g. "H&H") */
  shortName: z.string().min(1).default('H&H'),

  /** Subtitle / brand positioning descriptor (e.g. "Curated Modest Essentials & Jewelry") */
  subtitle: z.string().default('Curated Modest Essentials & Jewelry'),

  /** Brand tagline / banner headline */
  tagline: z.string().default('Crafted for Grace & Modesty'),

  /** Brand description for SEO meta tags, OpenGraph, PWA manifest, and search previews */
  description: z
    .string()
    .default(
      'Exquisite handcrafted nose-pieces and accessories designed for refined everyday elegance.'
    ),

  /** Official website URL */
  websiteUrl: z.string().url().default('https://handh.in'),

  /** Primary customer care email */
  supportEmail: z.string().email().default('support@handh.in'),

  /** Primary customer care / order telephone */
  supportPhone: z.string().default('+91 40 2355 7890'),

  /** WhatsApp concierge number in international format without spaces (e.g. "+919876543210") */
  whatsappNumber: z.string().default('+919876543210'),

  /** Official Instagram username (without '@') */
  instagramHandle: z.string().default('handh_official'),

  /** Currency code used throughout the platform */
  currency: z.string().default('INR'),

  /** Currency symbol (e.g. "₹") */
  currencySymbol: z.string().default('₹'),

  /** Statutory Corporate Identification Number (CIN) under Indian Companies Act */
  cin: z.string().default('U18101TG2024PTC189234'),

  /** Statutory Goods and Services Tax Identification Number (GSTIN) */
  gstin: z.string().default('36AAACH1234F1Z5'),

  /** Permanent Account Number (PAN) */
  pan: z.string().default('AAACH1234F'),

  /** Brand vocabulary & terminology tokens */
  terminology: z
    .object({
      /** Customer / User persona title (e.g. "Patron", "Client", "Member") */
      patronTitle: z.string().default('Patron'),

      /** Signature drop / collection title (e.g. "Signature Collection") */
      signatureTitle: z.string().default('Signature Collection'),

      /** Customer support / concierge desk title (e.g. "Luxury Concierge") */
      conciergeTitle: z.string().default('Luxury Concierge'),

      /** Workshop / atelier label (e.g. "Luxury Atelier") */
      atelierTitle: z.string().default('Luxury Atelier')
    })
    .default({}),

  /** Registered postal address */
  address: BrandAddressSchema.default({}),

  /** Statutory grievance officer disclosure */
  grievanceOfficer: BrandGrievanceOfficerSchema.default({}),

  /** Visual design system color palette */
  theme: BrandThemeSchema.default({})
});

export type BrandAddress = z.infer<typeof BrandAddressSchema>;
export type BrandGrievanceOfficer = z.infer<typeof BrandGrievanceOfficerSchema>;
export type BrandTheme = z.infer<typeof BrandThemeSchema>;
export type BrandIdentity = z.infer<typeof BrandIdentitySchema>;
