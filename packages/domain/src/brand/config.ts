import { BrandIdentitySchema } from './types';

import type { BrandIdentity } from './types';

/**
 * 👑 SINGLE SOURCE OF TRUTH FOR APPLICATION BRAND IDENTITY
 *
 * To rebrand the entire application in one go:
 * 1. Modify this configuration file (or set environment variables / database store settings).
 * 2. Every UI component, email template, WhatsApp notification, invoice, legal policy,
 *    order review consent, SEO metadata, and PWA manifest automatically reflects it.
 */
export const DEFAULT_BRAND_IDENTITY: BrandIdentity = BrandIdentitySchema.parse({});

/**
 * Resolves brand identity by deeply merging defaults, database/store settings,
 * and runtime environment variables.
 */
export function resolveBrandIdentity(
  overrides?: Partial<BrandIdentity> | null,
  envOverrides?: Record<string, string | undefined>
): BrandIdentity {
  const env = envOverrides ?? (typeof process !== 'undefined' ? process.env : {});

  const envBrand: Partial<BrandIdentity> = {};

  const brandName = env['BRAND_NAME'] || env['NEXT_PUBLIC_BRAND_NAME'];
  if (brandName) envBrand.name = brandName;

  const legalName = env['BRAND_LEGAL_NAME'] || env['COMPANY_LEGAL_NAME'];
  if (legalName) envBrand.legalName = legalName;

  const shortName = env['BRAND_SHORT_NAME'];
  if (shortName) envBrand.shortName = shortName;

  const tagline = env['BRAND_TAGLINE'];
  if (tagline) envBrand.tagline = tagline;

  const subtitle = env['BRAND_SUBTITLE'];
  if (subtitle) envBrand.subtitle = subtitle;

  const supportEmail = env['BRAND_SUPPORT_EMAIL'] || env['COMPANY_SUPPORT_EMAIL'];
  if (supportEmail) envBrand.supportEmail = supportEmail;

  const supportPhone = env['BRAND_SUPPORT_PHONE'] || env['COMPANY_SUPPORT_PHONE'];
  if (supportPhone) envBrand.supportPhone = supportPhone;

  const whatsapp = env['BRAND_WHATSAPP'];
  if (whatsapp) envBrand.whatsappNumber = whatsapp;

  const instagram = env['BRAND_INSTAGRAM'];
  if (instagram) envBrand.instagramHandle = instagram;

  const websiteUrl = env['BRAND_WEBSITE_URL'] || env['APP_URL'];
  if (websiteUrl) envBrand.websiteUrl = websiteUrl;

  const merged = {
    ...DEFAULT_BRAND_IDENTITY,
    ...(overrides || {}),
    ...envBrand,
    terminology: {
      ...DEFAULT_BRAND_IDENTITY.terminology,
      ...(overrides?.terminology || {})
    },
    address: {
      ...DEFAULT_BRAND_IDENTITY.address,
      ...(overrides?.address || {})
    },
    grievanceOfficer: {
      ...DEFAULT_BRAND_IDENTITY.grievanceOfficer,
      ...(overrides?.grievanceOfficer || {})
    },
    theme: {
      ...DEFAULT_BRAND_IDENTITY.theme,
      ...(overrides?.theme || {})
    }
  };

  const parsed = BrandIdentitySchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_BRAND_IDENTITY;
}

/**
 * Returns user name or formatted brand patron badge (e.g. "Fatima" or "H&H Patron").
 */
export function getBrandPatronLabel(
  customerName?: string | null,
  brand: BrandIdentity = DEFAULT_BRAND_IDENTITY
): string {
  if (customerName && customerName.trim()) {
    return customerName.trim();
  }
  return `${brand.shortName} ${brand.terminology.patronTitle}`;
}

/**
 * Returns affirmative statutory pre-purchase contract formation notice (E-COM-165).
 */
export function getBrandLegalConsentText(brand: BrandIdentity = DEFAULT_BRAND_IDENTITY): string {
  return `By placing this order, you confirm and agree to ${brand.name}'s Terms of Sale, Privacy Policy, and Refund Policy.`;
}

/**
 * Returns the authentication modal security header.
 */
export function getBrandSecureAccessTitle(brand: BrandIdentity = DEFAULT_BRAND_IDENTITY): string {
  return `${brand.name} Secure Access`;
}

/**
 * Returns account shipment tracking explanatory note.
 */
export function getBrandAccountTrackingNote(brand: BrandIdentity = DEFAULT_BRAND_IDENTITY): string {
  return `Once dispatched, you will receive a direct tracking link accessible through your ${brand.name} account and email notifications.`;
}

/**
 * Returns signature collection title (e.g. "H&H Signature Collection").
 */
export function getBrandSignatureDropLabel(brand: BrandIdentity = DEFAULT_BRAND_IDENTITY): string {
  return `${brand.name} ${brand.terminology.signatureTitle}`;
}

/**
 * Generates an official WhatsApp concierge deep-link URL.
 */
export function getBrandWhatsAppUrl(
  phoneOrRef?: string,
  message?: string,
  brand: BrandIdentity = DEFAULT_BRAND_IDENTITY
): string {
  const numberToUse = phoneOrRef
    ? phoneOrRef.replace(/[^0-9]/g, '')
    : brand.whatsappNumber.replace(/[^0-9]/g, '');
  const url = new URL(`https://wa.me/${numberToUse}`);
  if (message) {
    url.searchParams.set('text', message);
  }
  return url.toString();
}

/**
 * Generates brand-consistent email subject lines.
 */
export function getBrandNotificationSubject(
  type: 'confirmed' | 'dispatched' | 'delivered',
  orderNumber: string,
  brand: BrandIdentity = DEFAULT_BRAND_IDENTITY
): string {
  switch (type) {
    case 'confirmed':
      return `Order Confirmed: #${orderNumber} — ${brand.name} Luxury`;
    case 'dispatched':
      return `Dispatched: Your ${brand.name} Order #${orderNumber} is on the way`;
    case 'delivered':
      return `Delivered: Your ${brand.name} Order #${orderNumber}`;
  }
}
