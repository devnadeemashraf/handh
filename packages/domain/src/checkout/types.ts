import { z } from 'zod';

import { CartItemInputSchema } from '../cart/types';
import {
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  IndianPhoneSchema,
  isValidIndianPhone,
  normalizeIndianPhone
} from '../phone';

import type { CurrencyCode } from '../money';

export {
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  IndianPhoneSchema,
  isValidIndianPhone,
  normalizeIndianPhone
};

export const IndianPostalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code');

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(128),
  phone: IndianPhoneSchema,
  email: z.string().trim().email('Please enter a valid email address').max(255),
  line1: z.string().trim().min(3, 'House/Flat/Building and Street is required').max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  postalCode: IndianPostalCodeSchema,
  country: z.literal('IN').default('IN')
});

export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;

import { orderAttributionSchema } from '../analytics/types';

export const CheckoutSubmissionSchema = z.object({
  items: z.array(CartItemInputSchema).min(1, 'Cart cannot be empty').max(50),
  shippingAddress: ShippingAddressSchema,
  customerNotes: z.string().trim().max(500).optional(),
  couponCode: z.string().trim().max(32).optional(),
  attribution: orderAttributionSchema.optional(),
  idempotencyKey: z.string().uuid('Valid idempotency key is required')
});

export type CheckoutSubmissionInput = z.infer<typeof CheckoutSubmissionSchema>;

export interface GstBreakdown {
  ratePercent: number;
  taxableAmountMinor: number;
  totalTaxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  isInterState: boolean;
  originState: string;
  destinationState?: string | undefined;
}

export interface CheckoutFinancialBreakdown {
  subtotalMinor: number;
  shippingMinor: number;
  discountMinor: number;
  totalMinor: number;
  taxMinor: number;
  cgstMinor: number;
  sgstMinor: number;
  igstMinor: number;
  taxableAmountMinor: number;
  currency: CurrencyCode;
  isFreeDelivery: boolean;
  freeDeliveryThresholdMinor: number;
  remainingForFreeDeliveryMinor: number;
  gst?: GstBreakdown | undefined;
}

export interface CheckoutOrderResult {
  orderId: string;
  orderNumber: string;
  currency: CurrencyCode;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  expiresAt: string;
  receiptToken?: string;
}
