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

    // WhatsApp Cloud API (E-COM-081)
    WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().optional(),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
    WHATSAPP_API_VERSION: z.string().default('v21.0'),
    WHATSAPP_API_URL: z.string().url().default('https://graph.facebook.com'),

    // Auth & Security
    ADMIN_SESSION_SECRET: z
      .string({ required_error: 'ADMIN_SESSION_SECRET is required' })
      .min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters long for session encryption'),
    ADMIN_ACCESS_KEY: z
      .string()
      .min(8, 'ADMIN_ACCESS_KEY must be at least 8 characters long')
      .default('hh_dev_access_key'),
    ADMIN_PASSWORD: z
      .string()
      .min(8, 'ADMIN_PASSWORD must be at least 8 characters long')
      .default('hh_admin_secret_pass_2026'),
    ORDER_RECEIPT_SECRET: z.string().min(16).optional(),

    // Shipping & Courier Webhooks (E-COM-062)
    SHIPROCKET_EMAIL: z.string().optional(),
    SHIPROCKET_PASSWORD: z.string().optional(),
    SHIPROCKET_API_KEY: z.string().optional(),
    SHIPROCKET_WEBHOOK_SECRET: z.string().optional(),
    TRACKINGMORE_API_KEY: z.string().optional(),
    TRACKINGMORE_WEBHOOK_SECRET: z.string().optional(),
    MANUAL_WEBHOOK_SECRET: z.string().optional(),

    // Logistics & Origin Warehouse (E-COM-067)
    WAREHOUSE_NAME: z.string().default('H&H Artisan Atelier'),
    WAREHOUSE_PHONE: z.string().default('+919876543210'),
    WAREHOUSE_LINE1: z.string().default('Banjara Hills Road No 10'),
    WAREHOUSE_LINE2: z.string().optional(),
    WAREHOUSE_CITY: z.string().default('Hyderabad'),
    WAREHOUSE_STATE: z.string().default('Telangana'),
    WAREHOUSE_POSTAL_CODE: z.string().default('500034'),
    WAREHOUSE_COUNTRY: z.string().default('India'),

    // Initial Admin Auto-Provisioning
    INITIAL_ADMIN_EMAIL: z.string().email().default('admin@handh.in'),
    INITIAL_ADMIN_PASSWORD: z.string().min(8).default('hh_admin_master_password_2026'),
    INITIAL_ADMIN_ROLE: z.enum(['admin', 'super_admin']).default('super_admin'),

    // Enterprise SSO & Corporate Domain Gating
    ADMIN_ALLOWED_DOMAINS: z.string().default('handh.in'),
    ADMIN_ALLOWED_EMAILS: z.string().default(''),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    ZOHO_CLIENT_ID: z.string().optional(),
    ZOHO_CLIENT_SECRET: z.string().optional(),
    ZOHO_ACCOUNTS_DOMAIN: z.string().default('accounts.zoho.in'),

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
    R2_PUBLIC_URL: z.string().url().optional(),

    // Statutory Grievance Redressal & Corporate Identity (E-COM-065, E-COM-161)
    GRIEVANCE_OFFICER_NAME: z.string().default('Mohammed Irfan'),
    GRIEVANCE_OFFICER_DESIGNATION: z
      .string()
      .default('Head of Customer Experience & Grievance Officer'),
    GRIEVANCE_OFFICER_EMAIL: z.string().email().default('grievance@handh.in'),
    GRIEVANCE_OFFICER_PHONE: z.string().default('+91 40 2355 7890'),
    COMPANY_LEGAL_NAME: z.string().default('H&H Luxury Modest Wear Private Limited'),
    COMPANY_REGISTERED_ADDRESS: z
      .string()
      .default('Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India'),
    COMPANY_CIN: z.string().default('U18101TG2024PTC189234'),
    COMPANY_GSTIN: z.string().default('36AAACH1234F1Z5'),
    COMPANY_SUPPORT_EMAIL: z.string().email().default('support@handh.in'),
    COMPANY_SUPPORT_PHONE: z.string().default('+91 40 2355 7890')
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
        'ADMIN_SESSION_SECRET',
        'ADMIN_ACCESS_KEY',
        'ADMIN_PASSWORD'
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

      if (
        data.ADMIN_ACCESS_KEY === 'hh_dev_access_key' ||
        data.ADMIN_PASSWORD === 'hh_admin_secret_pass_2026'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `In ${data.NODE_ENV}, ADMIN_ACCESS_KEY and ADMIN_PASSWORD cannot use default development credentials.`,
          path: ['ADMIN_ACCESS_KEY']
        });
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
