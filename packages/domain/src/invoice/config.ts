import { z } from 'zod';

import { DEFAULT_BRAND_IDENTITY } from '../brand/config';

import type { InvoiceTemplateConfig } from './types';

export const defaultInvoiceTemplate: InvoiceTemplateConfig = {
  brandName: `${DEFAULT_BRAND_IDENTITY.name} ${DEFAULT_BRAND_IDENTITY.terminology.atelierTitle}`,
  legalName: DEFAULT_BRAND_IDENTITY.legalName,
  tagline: DEFAULT_BRAND_IDENTITY.tagline,
  gstin: DEFAULT_BRAND_IDENTITY.gstin,
  pan: DEFAULT_BRAND_IDENTITY.pan,
  addressLine1: DEFAULT_BRAND_IDENTITY.address.street,
  addressLine2: undefined,
  city: DEFAULT_BRAND_IDENTITY.address.city,
  state: DEFAULT_BRAND_IDENTITY.address.state,
  postalCode: DEFAULT_BRAND_IDENTITY.address.postalCode,
  country: DEFAULT_BRAND_IDENTITY.address.country,
  supportEmail: DEFAULT_BRAND_IDENTITY.supportEmail,
  supportPhone: DEFAULT_BRAND_IDENTITY.supportPhone,
  footerNote:
    'Thank you for supporting traditional Indian artisans. Handcrafted in pure silver and brass. All pieces are hallmarked.',
  invoicePrefix: `INV-${DEFAULT_BRAND_IDENTITY.shortName.replace(/[^A-Za-z0-9]/g, '')}-`,
  showGstBreakdown: false
};

export const InvoiceTemplateConfigSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required').default(defaultInvoiceTemplate.brandName),
  legalName: z.string().optional(),
  tagline: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  addressLine1: z
    .string()
    .min(1, 'Address is required')
    .default(defaultInvoiceTemplate.addressLine1),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required').default(defaultInvoiceTemplate.city),
  state: z.string().min(1, 'State is required').default(defaultInvoiceTemplate.state),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .default(defaultInvoiceTemplate.postalCode),
  country: z.string().default('India'),
  supportEmail: z.string().email().default(defaultInvoiceTemplate.supportEmail),
  supportPhone: z.string().default(defaultInvoiceTemplate.supportPhone),
  footerNote: z.string().default(defaultInvoiceTemplate.footerNote),
  invoicePrefix: z.string().default(defaultInvoiceTemplate.invoicePrefix),
  showGstBreakdown: z.boolean().default(false)
});

export function resolveInvoiceTemplate(custom?: unknown): InvoiceTemplateConfig {
  if (!custom || typeof custom !== 'object') {
    return defaultInvoiceTemplate;
  }
  const result = InvoiceTemplateConfigSchema.safeParse(custom);
  if (result.success) {
    return result.data;
  }
  return defaultInvoiceTemplate;
}
