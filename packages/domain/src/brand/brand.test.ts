import { describe, expect, it } from 'vitest';

import {
  DEFAULT_BRAND_IDENTITY,
  getBrandAccountTrackingNote,
  getBrandLegalConsentText,
  getBrandNotificationSubject,
  getBrandPatronLabel,
  getBrandSecureAccessTitle,
  getBrandSignatureDropLabel,
  getBrandWhatsAppUrl,
  resolveBrandIdentity
} from './config';
import { BrandIdentitySchema } from './types';

describe('Brand Identity Single Source of Truth', () => {
  it('validates default brand identity against schema', () => {
    expect(DEFAULT_BRAND_IDENTITY.name).toBe('H&H');
    expect(DEFAULT_BRAND_IDENTITY.legalName).toBe('H&H Luxury Modest Wear Private Limited');
    expect(DEFAULT_BRAND_IDENTITY.shortName).toBe('H&H');
    expect(DEFAULT_BRAND_IDENTITY.supportEmail).toBe('support@handh.in');
    expect(DEFAULT_BRAND_IDENTITY.currency).toBe('INR');

    const result = BrandIdentitySchema.safeParse(DEFAULT_BRAND_IDENTITY);
    expect(result.success).toBe(true);
  });

  it('rebrands entire application in one go via resolveBrandIdentity', () => {
    const customBrand = resolveBrandIdentity({
      name: 'Noor Atelier',
      legalName: 'Noor Luxury Goods Private Limited',
      shortName: 'Noor',
      tagline: 'Timeless Elegance & Grace',
      supportEmail: 'care@noor.luxury',
      whatsappNumber: '+919999988888',
      terminology: {
        patronTitle: 'VIP Member',
        signatureTitle: 'Heritage Line',
        conciergeTitle: 'Bespoke Concierge',
        atelierTitle: 'Design Studio'
      }
    });

    expect(customBrand.name).toBe('Noor Atelier');
    expect(customBrand.legalName).toBe('Noor Luxury Goods Private Limited');
    expect(customBrand.shortName).toBe('Noor');

    // Test derived helpers with custom brand
    expect(getBrandPatronLabel(null, customBrand)).toBe('Noor VIP Member');
    expect(getBrandPatronLabel('Amina', customBrand)).toBe('Amina');
    expect(getBrandLegalConsentText(customBrand)).toBe(
      "By placing this order, you confirm and agree to Noor Atelier's Terms of Sale, Privacy Policy, and Refund Policy."
    );
    expect(getBrandSecureAccessTitle(customBrand)).toBe('Noor Atelier Secure Access');
    expect(getBrandAccountTrackingNote(customBrand)).toContain(
      'accessible through your Noor Atelier account'
    );
    expect(getBrandSignatureDropLabel(customBrand)).toBe('Noor Atelier Heritage Line');
    expect(getBrandNotificationSubject('confirmed', 'ORD-123', customBrand)).toBe(
      'Order Confirmed: #ORD-123 — Noor Atelier Luxury'
    );
    expect(getBrandWhatsAppUrl(undefined, 'Hello', customBrand)).toBe(
      'https://wa.me/919999988888?text=Hello'
    );
  });

  it('supports environment variable overrides for rapid zero-code rebranding', () => {
    const envOverrides = {
      BRAND_NAME: 'Zeenat Haute',
      BRAND_LEGAL_NAME: 'Zeenat Modest Retail Pvt. Ltd.',
      BRAND_SUPPORT_EMAIL: 'concierge@zeenat.com'
    };

    const resolved = resolveBrandIdentity(null, envOverrides);
    expect(resolved.name).toBe('Zeenat Haute');
    expect(resolved.legalName).toBe('Zeenat Modest Retail Pvt. Ltd.');
    expect(resolved.supportEmail).toBe('concierge@zeenat.com');
    // Non-overridden properties fall back to single source of truth
    expect(resolved.currency).toBe('INR');
  });

  it('generates consistent email notification subjects', () => {
    expect(getBrandNotificationSubject('confirmed', 'HH-101')).toBe(
      'Order Confirmed: #HH-101 — H&H Luxury'
    );
    expect(getBrandNotificationSubject('dispatched', 'HH-101')).toBe(
      'Dispatched: Your H&H Order #HH-101 is on the way'
    );
    expect(getBrandNotificationSubject('delivered', 'HH-101')).toBe(
      'Delivered: Your H&H Order #HH-101'
    );
  });
});
