import { z } from 'zod';

export type Environment = 'development' | 'test' | 'staging' | 'production';

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_URL: z.string().url().default('http://localhost:3000'),

    // Database & Cache
    DATABASE_URL: z
      .string({ required_error: 'DATABASE_URL is required' })
      .min(1, 'DATABASE_URL cannot be empty'),
    REDIS_URL: z
      .string({ required_error: 'REDIS_URL is required' })
      .min(1, 'REDIS_URL cannot be empty'),

    // Payments
    RAZORPAY_KEY_ID: z
      .string({ required_error: 'RAZORPAY_KEY_ID is required' })
      .min(1, 'RAZORPAY_KEY_ID cannot be empty'),
    RAZORPAY_KEY_SECRET: z
      .string({ required_error: 'RAZORPAY_KEY_SECRET is required' })
      .min(1, 'RAZORPAY_KEY_SECRET cannot be empty'),
    RAZORPAY_WEBHOOK_SECRET: z
      .string({ required_error: 'RAZORPAY_WEBHOOK_SECRET is required' })
      .min(1, 'RAZORPAY_WEBHOOK_SECRET cannot be empty'),

    // Email
    RESEND_API_KEY: z
      .string({ required_error: 'RESEND_API_KEY is required' })
      .min(1, 'RESEND_API_KEY cannot be empty'),

    // Auth & Security
    ADMIN_SESSION_SECRET: z
      .string({ required_error: 'ADMIN_SESSION_SECRET is required' })
      .min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters long for session encryption'),

    // Storage (S3 / Cloudflare R2 / Local Floci)
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().default('hh-media-dev'),
    S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
    S3_PUBLIC_URL: z.string().url().optional(),

    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: z.string().url().optional()
  })
  .superRefine((data, ctx) => {
    // In staging and production, strictly disallow placeholder or dummy secrets
    if (data.NODE_ENV === 'production' || data.NODE_ENV === 'staging') {
      const sensitiveKeys = [
        'DATABASE_URL',
        'REDIS_URL',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'RAZORPAY_WEBHOOK_SECRET',
        'RESEND_API_KEY',
        'ADMIN_SESSION_SECRET'
      ] as const;

      for (const key of sensitiveKeys) {
        const val = data[key];
        if (typeof val === 'string' && (val.includes('placeholder') || val.includes('insecure'))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `In ${data.NODE_ENV}, ${key} cannot contain placeholder/insecure values.`,
            path: [key]
          });
        }
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates environment variables and crashes immediately with a clean error message
 * if any configuration is missing or malformed.
 */
export function validateServerEnv(rawEnv: Record<string, unknown> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - [${err.path.join('.') || 'root'}]: ${err.message}`)
      .join('\n');

    throw new Error(
      `\n❌ CRITICAL: Environment validation failed at startup:\n${errorDetails}\nCheck your environment configuration.\n`
    );
  }

  return result.data;
}
