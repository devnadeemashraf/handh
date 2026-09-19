import { ShippingAdapterRegistry } from '@hh/domain';

/**
 * Initializes and returns the global ShippingAdapterRegistry with credentials
 * from environment variables (or fallbacks for offline development).
 */
export function getShippingRegistry(): ShippingAdapterRegistry {
  return ShippingAdapterRegistry.createDefault({
    manualSecret: process.env['MANUAL_WEBHOOK_SECRET'] ?? 'manual_dev_secret',
    shiprocket: {
      email: process.env['SHIPROCKET_EMAIL'],
      password: process.env['SHIPROCKET_PASSWORD'],
      apiKey: process.env['SHIPROCKET_API_KEY'],
      webhookSecret: process.env['SHIPROCKET_WEBHOOK_SECRET'] ?? 'shiprocket_dev_secret'
    },
    trackingmore: {
      apiKey: process.env['TRACKINGMORE_API_KEY'],
      webhookSecret: process.env['TRACKINGMORE_WEBHOOK_SECRET'] ?? 'trackingmore_dev_secret'
    }
  });
}
