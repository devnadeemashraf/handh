import { ShippingAdapterRegistry } from '@hh/domain';

/**
 * Initializes and returns the global ShippingAdapterRegistry with credentials
 * from environment variables.
 *
 * In production, never falls back to hardcoded dev placeholder secrets (E-COM-062).
 */
export function getShippingRegistry(): ShippingAdapterRegistry {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevOrTest =
    !isProduction || process.env.NODE_ENV === 'test' || process.env['ENABLE_DEV_MOCKS'] === 'true';

  const manualSecret =
    process.env['MANUAL_WEBHOOK_SECRET'] ?? (isDevOrTest ? 'manual_dev_secret' : undefined);

  const shiprocketSecret =
    process.env['SHIPROCKET_WEBHOOK_SECRET'] ?? (isDevOrTest ? 'shiprocket_dev_secret' : undefined);

  const trackingmoreSecret =
    process.env['TRACKINGMORE_WEBHOOK_SECRET'] ??
    (isDevOrTest ? 'trackingmore_dev_secret' : undefined);

  return ShippingAdapterRegistry.createDefault({
    manualSecret,
    shiprocket: {
      email: process.env['SHIPROCKET_EMAIL'],
      password: process.env['SHIPROCKET_PASSWORD'],
      apiKey: process.env['SHIPROCKET_API_KEY'],
      webhookSecret: shiprocketSecret
    },
    trackingmore: {
      apiKey: process.env['TRACKINGMORE_API_KEY'],
      webhookSecret: trackingmoreSecret
    }
  });
}
