import { z } from 'zod';

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'cart',
  'checkout',
  'track',
  'health',
  'login',
  'signup',
  'order',
  'orders',
  'webhook',
  'webhooks'
]);

export const slugSchema = z
  .string()
  .min(2, 'Slug must be at least 2 characters')
  .max(128, 'Slug cannot exceed 128 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with optional hyphens')
  .refine((slug) => !RESERVED_SLUGS.has(slug), {
    message: 'This slug is a reserved system route and cannot be used.'
  });

export const createStoreSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, 'Store name is required').max(128),
  description: z.string().max(1000).optional(),
  defaultCurrency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  isActive: z.boolean().default(true),
  settings: z
    .object({
      contactEmail: z.string().email().optional(),
      supportPhone: z.string().optional(),
      instagramHandle: z.string().optional(),
      orderNotificationEmails: z.array(z.string().email()).optional(),
      enableCoupons: z.boolean().optional()
    })
    .default({})
});

export const updateStoreSchema = createStoreSchema.partial();

export const createCategorySchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  parentId: z.string().uuid('Invalid parent category ID').optional(),
  slug: slugSchema,
  name: z.string().min(1, 'Category name is required').max(128),
  description: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const updateCategorySchema = createCategorySchema.partial().omit({ storeId: true });

export const createVariantInputSchema = z.object({
  sku: z
    .string()
    .min(3, 'SKU must be at least 3 characters')
    .max(64, 'SKU cannot exceed 64 characters')
    .regex(
      /^[A-Z0-9_-]+$/,
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
    ),
  title: z.string().min(1, 'Variant title is required').max(128),
  priceMinor: z
    .number()
    .int('Price must be an integer in minor units')
    .nonnegative('Price cannot be negative'),
  compareAtPriceMinor: z
    .number()
    .int('Compare at price must be an integer in minor units')
    .nonnegative('Compare at price cannot be negative')
    .optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  weightGrams: z.number().int().nonnegative().default(0),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  options: z
    .array(
      z.object({
        name: z.string(),
        value: z.string()
      })
    )
    .optional()
    .default([]),
  initialQuantity: z
    .number()
    .int('Initial quantity must be an integer')
    .nonnegative('Initial quantity cannot be negative')
    .default(0)
});

export const createProductSchema = z.object({
  storeId: z.string().uuid('Invalid store ID'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  department: z.string().optional().default('unisex'),
  slug: slugSchema,
  title: z.string().min(1, 'Product title is required').max(255),
  description: z.string().default(''),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  isCustomizable: z.boolean().optional().default(false),
  customizationConfig: z.record(z.any()).optional().nullable(),
  specifications: z
    .record(z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .default({}),
  tags: z.array(z.string()).optional().default([]),
  countryOfOrigin: z.string().max(64).optional().default('India'),
  netQuantity: z.string().max(32).optional().default('1 N'),
  commodityName: z.string().max(128).optional(),
  manufacturerName: z.string().max(255).optional(),
  manufacturerAddress: z.string().optional(),
  packerName: z.string().max(255).optional(),
  packerAddress: z.string().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  variants: z.array(createVariantInputSchema).min(1, 'Product must have at least one variant'),
  images: z
    .array(
      z.object({
        storageKey: z.string().min(1),
        url: z.string().url('Image must have a valid URL'),
        altText: z.string().default(''),
        sortOrder: z.number().int().min(0).default(0)
      })
    )
    .default([])
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateVariantInput = z.input<typeof createVariantInputSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
