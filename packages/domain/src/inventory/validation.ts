import { z } from 'zod';

import type {
  StockAdjustmentInput,
  UpdateProductStatusInput,
  UpdateVariantPriceInput
} from './types';

export const StockAdjustmentSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  delta: z
    .number()
    .int('Adjustment must be an integer')
    .refine((val) => val !== 0, 'Adjustment delta cannot be zero'),
  reason: z.enum([
    'manual_restock',
    'manual_correction',
    'damaged',
    'order_captured',
    'order_cancelled',
    'initial_seed'
  ]),
  note: z.string().max(255).optional()
}) satisfies z.ZodType<StockAdjustmentInput>;

export const UpdateVariantPriceSchema = z.object({
  variantId: z.string().uuid('Invalid variant ID'),
  priceMinor: z.number().int('Price must be an integer').nonnegative('Price cannot be negative')
}) satisfies z.ZodType<UpdateVariantPriceInput>;

export const UpdateProductStatusSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  status: z.enum(['draft', 'published', 'archived'])
}) satisfies z.ZodType<UpdateProductStatusInput>;
