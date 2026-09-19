import { describe, expect, it } from 'vitest';

import {
  defaultInvoiceTemplate,
  InvoiceTemplateConfigSchema,
  resolveInvoiceTemplate
} from './config';

describe('Invoice Domain & Template Config', () => {
  it('returns default invoice template when custom config is undefined or empty', () => {
    const template = resolveInvoiceTemplate(undefined);
    expect(template.brandName).toBe(defaultInvoiceTemplate.brandName);
    expect(template.invoicePrefix).toBe('INV-HH-');
    expect(template.supportEmail).toBe('concierge@handh.in');
  });

  it('resolves custom invoice template overriding specific fields', () => {
    const custom = {
      brandName: 'Noor & Haya Atelier',
      legalName: 'NH Artisans LLP',
      gstin: '07AAAAA0000A1Z5',
      addressLine1: 'Suite 12, Chandni Chowk',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110006',
      supportEmail: 'care@noorhaya.in',
      supportPhone: '+91 99999 88888',
      footerNote: 'Custom royal packaging note.',
      invoicePrefix: 'NH-TAX-',
      showGstBreakdown: true
    };

    const template = resolveInvoiceTemplate(custom);
    expect(template.brandName).toBe('Noor & Haya Atelier');
    expect(template.invoicePrefix).toBe('NH-TAX-');
    expect(template.showGstBreakdown).toBe(true);
    expect(template.gstin).toBe('07AAAAA0000A1Z5');
  });

  it('validates schema and rejects invalid emails', () => {
    const invalid = {
      supportEmail: 'not-an-email'
    };

    const result = InvoiceTemplateConfigSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
