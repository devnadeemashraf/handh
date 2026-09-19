import { z } from 'zod';

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  value: number; // percentage (e.g. 10 for 10%) or minor units (e.g. 10000 paise for ₹100)
  minOrderValueMinor: number;
  maxDiscountMinor?: number | null;
  usageLimit?: number | null;
  timesUsed: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponValidationInput {
  code: string;
  subtotalMinor: number;
  now?: Date;
}

export interface CouponValidationSuccess {
  valid: true;
  coupon: Coupon;
  discountMinor: number;
  newSubtotalMinor: number;
}

export interface CouponValidationFailure {
  valid: false;
  reason: string;
}

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

export const CreateCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(32, 'Coupon code must not exceed 32 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens, and underscores')
    .transform((c) => c.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed']),
  value: z.number().int().positive('Discount value must be greater than 0'),
  minOrderValueMinor: z
    .number()
    .int()
    .nonnegative('Minimum order value cannot be negative')
    .default(0),
  maxDiscountMinor: z
    .number()
    .int()
    .positive('Max discount cap must be greater than 0')
    .nullable()
    .optional(),
  usageLimit: z.number().int().positive('Usage limit must be greater than 0').nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true)
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;

export const UpdateCouponSchema = CreateCouponSchema.partial().omit({ code: true });
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
