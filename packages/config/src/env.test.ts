import { describe, expect, it } from 'vitest';

import { validateServerEnv } from './env';

describe('Server Environment Validation', () => {
  const validDevEnv = {
    NODE_ENV: 'development',
    PORT: '3000',
    APP_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/hh_dev',
    REDIS_URL: 'redis://localhost:6379',
    RAZORPAY_KEY_ID: 'rzp_test_123',
    RAZORPAY_KEY_SECRET: 'secret_123',
    RAZORPAY_WEBHOOK_SECRET: 'whsec_123',
    RESEND_API_KEY: 're_123',
    ADMIN_SESSION_SECRET: 'this_is_a_very_long_secure_secret_key_12345'
  };

  const validProdEnv = {
    ...validDevEnv,
    NODE_ENV: 'production',
    ADMIN_ACCESS_KEY: 'super_secret_prod_gate_key_9999',
    ADMIN_PASSWORD: 'super_strong_production_password_2026'
  };

  it('validates a complete and correct development configuration', () => {
    const env = validateServerEnv(validDevEnv);
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000); // Coerced to number
    expect(env.DATABASE_URL).toBe(validDevEnv.DATABASE_URL);
    expect(env.ADMIN_ACCESS_KEY).toBe('hh_dev_access_key');
    expect(env.WHATSAPP_API_VERSION).toBe('v21.0');
    expect(env.WHATSAPP_API_URL).toBe('https://graph.facebook.com');
    expect(env.WAREHOUSE_NAME).toBe('H&H Artisan Atelier');
    expect(env.WAREHOUSE_PHONE).toBe('+919876543210');
    expect(env.WAREHOUSE_LINE1).toBe('Banjara Hills Road No 10');
    expect(env.WAREHOUSE_CITY).toBe('Hyderabad');
    expect(env.WAREHOUSE_STATE).toBe('Telangana');
    expect(env.WAREHOUSE_POSTAL_CODE).toBe('500034');
    expect(env.WAREHOUSE_COUNTRY).toBe('India');
  });

  it('fails fast when critical database or payment variables are missing', () => {
    const brokenEnv = { ...validDevEnv };
    // @ts-expect-error Testing runtime missing field
    delete brokenEnv.DATABASE_URL;

    expect(() => validateServerEnv(brokenEnv)).toThrowError(/DATABASE_URL is required/);
  });

  it('strictly rejects placeholder or insecure secrets when NODE_ENV is production', () => {
    const prodEnvWithPlaceholders = {
      ...validProdEnv,
      RAZORPAY_KEY_SECRET: 'placeholder_secret_never_use_in_prod'
    };

    expect(() => validateServerEnv(prodEnvWithPlaceholders)).toThrowError(
      /cannot contain placeholder\/insecure values/
    );
  });

  it('strictly rejects default development admin credentials in production', () => {
    const prodWithDevCreds = {
      ...validProdEnv,
      ADMIN_ACCESS_KEY: 'hh_dev_access_key'
    };

    expect(() => validateServerEnv(prodWithDevCreds)).toThrowError(
      /cannot use default development credentials/
    );
  });

  it('strictly enforces session secret minimum length for security', () => {
    const shortSecretEnv = {
      ...validDevEnv,
      ADMIN_SESSION_SECRET: 'short_key'
    };

    expect(() => validateServerEnv(shortSecretEnv)).toThrowError(
      /ADMIN_SESSION_SECRET must be at least 32 characters long/
    );
  });

  it('correctly parses brand identity and statutory corporate environment variables', () => {
    const brandEnv = {
      ...validDevEnv,
      BRAND_NAME: 'Zeenat Haute',
      BRAND_LEGAL_NAME: 'Zeenat Modest Retail Pvt. Ltd.',
      BRAND_SHORT_NAME: 'Zeenat',
      BRAND_TAGLINE: 'Timeless Grace',
      BRAND_SUBTITLE: 'Haute Modest Couture',
      BRAND_SUPPORT_EMAIL: 'concierge@zeenat.com',
      BRAND_SUPPORT_PHONE: '+91 40 1234 5678',
      BRAND_WHATSAPP: '+919876543210',
      BRAND_INSTAGRAM: 'zeenat_haute',
      BRAND_WEBSITE_URL: 'https://zeenat.com'
    };

    const env = validateServerEnv(brandEnv);
    expect(env.BRAND_NAME).toBe('Zeenat Haute');
    expect(env.BRAND_LEGAL_NAME).toBe('Zeenat Modest Retail Pvt. Ltd.');
    expect(env.BRAND_SHORT_NAME).toBe('Zeenat');
    expect(env.BRAND_TAGLINE).toBe('Timeless Grace');
    expect(env.BRAND_SUBTITLE).toBe('Haute Modest Couture');
    expect(env.BRAND_SUPPORT_EMAIL).toBe('concierge@zeenat.com');
    expect(env.BRAND_SUPPORT_PHONE).toBe('+91 40 1234 5678');
    expect(env.BRAND_WHATSAPP).toBe('+919876543210');
    expect(env.BRAND_INSTAGRAM).toBe('zeenat_haute');
    expect(env.BRAND_WEBSITE_URL).toBe('https://zeenat.com');
    expect(env.COMPANY_CIN).toBe('U18101TG2024PTC189234');
    expect(env.COMPANY_GSTIN).toBe('36AAACH1234F1Z5');
  });
});
