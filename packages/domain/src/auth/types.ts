import { z } from 'zod';

import { IndianPostalCodeSchema } from '../checkout/types';

import type { CurrencyCode } from '../money';

export const USER_ROLES = ['customer', 'admin', 'super_admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ALL_PERMISSIONS = [
  // Customer permissions
  'catalog:browse',
  'cart:manage',
  'checkout:place_order',
  'orders:view_own',
  'profile:manage',
  'addresses:manage',
  'family:manage',
  'wishlist:manage',

  // Operations / Admin permissions
  'orders:view_all',
  'orders:manage',
  'inventory:manage',
  'products:manage',
  'coupons:manage',
  'insights:view',
  'fulfillment:manage',

  // Super Admin / Governance permissions
  'brand:manage',
  'service_control:manage',
  'users:manage_roles',
  'invoice:manage_templates'
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export type OTPPurpose = 'login' | 'verify_email';

export const OTP_CONFIG = {
  length: 6,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  maxAttempts: 3
} as const;

export const SESSION_CONFIG = {
  customerTtlMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  adminTtlMs: 12 * 60 * 60 * 1000, // 12 hours
  tokenBytes: 32
} as const;

import {
  AuthPhoneSchema,
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  IndianPhoneSchema,
  isValidIndianPhone,
  normalizeIndianPhone
} from '../phone';

export {
  AuthPhoneSchema,
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  IndianPhoneSchema,
  isValidIndianPhone,
  normalizeIndianPhone
};

export interface User {
  id: string;
  storeId: string;
  phone: string;
  phoneVerified: boolean;
  email?: string | null | undefined;
  emailVerified: boolean;
  name?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  role: UserRole;
  whatsappOptIn: boolean;
  lastLoginAt?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null | undefined;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FamilySizeSchema = z.object({
  abaya: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional(),
  hijab: z.string().trim().max(32).optional(),
  shoe: z.string().trim().max(16).optional(),
  ring: z.string().trim().max(16).optional()
});
export type FamilySizePreferences = z.infer<typeof FamilySizeSchema>;

export const FamilyStyleSchema = z.object({
  preferredColors: z.array(z.string().trim().max(32)).max(10).optional(),
  preferredPatterns: z.array(z.string().trim().max(32)).max(10).optional(),
  modestyLevel: z.enum(['full_coverage', 'moderate', 'light']).optional()
});
export type FamilyStylePreferences = z.infer<typeof FamilyStyleSchema>;

export const FamilyPreferencesSchema = z.object({
  sizes: FamilySizeSchema.optional(),
  style: FamilyStyleSchema.optional(),
  notes: z.string().trim().max(500).optional()
});
export type FamilyPreferences = z.infer<typeof FamilyPreferencesSchema>;

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship?: string | null | undefined;
  preferences: FamilyPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null | undefined;
  addedAt: string;
}

export interface WishlistProductInfo {
  id: string;
  title: string;
  slug: string;
  priceMinor: number;
  compareAtPriceMinor?: number | null | undefined;
  currency: CurrencyCode;
  imageUrl?: string | null | undefined;
  isAvailable: boolean;
  defaultVariantId?: string | undefined;
}

export interface WishlistItemWithDetails extends WishlistItem {
  product?: WishlistProductInfo | null | undefined;
}

export const RequestOTPSchema = z.object({
  phone: AuthPhoneSchema,
  purpose: z.enum(['login', 'verify_email']).default('login')
});
export type RequestOTPInput = z.infer<typeof RequestOTPSchema>;

export const VerifyOTPSchema = z.object({
  phone: AuthPhoneSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
  purpose: z.enum(['login', 'verify_email']).default('login'),
  whatsappOptIn: z.boolean().optional()
});
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;

export const CreateAddressSchema = z.object({
  label: z.string().trim().min(1, 'Label is required').max(64).default('Home'),
  recipientName: z.string().trim().min(2, 'Recipient name is required').max(128),
  phone: AuthPhoneSchema,
  line1: z.string().trim().min(3, 'Address line 1 is required').max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  postalCode: IndianPostalCodeSchema,
  country: z.literal('IN').default('IN'),
  isDefault: z.boolean().default(false)
});
export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;

export const CreateFamilyMemberSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(128),
  relationship: z.string().trim().max(64).optional(),
  preferences: FamilyPreferencesSchema.default({})
});
export type CreateFamilyMemberInput = z.infer<typeof CreateFamilyMemberSchema>;

export const UpdateFamilyMemberSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  relationship: z.string().trim().max(64).optional(),
  preferences: FamilyPreferencesSchema.optional()
});
export type UpdateFamilyMemberInput = z.infer<typeof UpdateFamilyMemberSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
  whatsappOptIn: z.boolean().optional()
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
