import { z } from 'zod';
import type { InvoiceTemplateConfig } from './types';

export const defaultInvoiceTemplate: InvoiceTemplateConfig = {
  brandName: 'H&H Artisan Studio',
  legalName: 'H&H Luxury Goods Pvt. Ltd.',
  tagline: 'Crafted for Grace & Modesty',
  gstin: '27AABCH1234F1Z5',
  pan: 'AABCH1234F',
  addressLine1: 'Workshop 4B, Heritage Silversmith Enclave',
  addressLine2: 'Shahjahanabad, Old Delhi',
  city: 'New Delhi',
  state: 'Delhi',
  postalCode: '110006',
  country: 'India',
  supportEmail: 'concierge@handh.in',
  supportPhone: '+91 98765 43210',
  footerNote:
    'Thank you for supporting traditional Indian artisans. Handcrafted in pure silver and brass. All pieces are hallmarked.',
  invoicePrefix: 'INV-HH-',
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
