import { z } from 'zod';

import type { ServiceControlConfig } from './types';

export const defaultServiceControlConfig: ServiceControlConfig = {
  operatingStatus: 'active',
  checkoutEnabled: true,
  paymentsEnabled: true,
  headline: 'Checkout & Payments Temporarily Paused',
  maintenanceNotice:
    'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'
};

export const ServiceControlConfigSchema = z.object({
  operatingStatus: z.enum(['active', 'maintenance']).default('active'),
  checkoutEnabled: z.boolean().default(true),
  paymentsEnabled: z.boolean().default(true),
  headline: z.string().min(1).default('Checkout & Payments Temporarily Paused'),
  maintenanceNotice: z
    .string()
    .min(1)
    .default(
      'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'
    )
});

/**
 * Resolves a safe ServiceControlConfig from raw/custom store settings.
 */
export function resolveServiceControl(custom?: unknown): ServiceControlConfig {
  if (!custom || typeof custom !== 'object') {
    return defaultServiceControlConfig;
  }

  const result = ServiceControlConfigSchema.safeParse(custom);
  if (result.success) {
    return result.data;
  }

  const raw = custom as Record<string, unknown>;
  return {
    operatingStatus: raw['operatingStatus'] === 'maintenance' ? 'maintenance' : 'active',
    checkoutEnabled: typeof raw['checkoutEnabled'] === 'boolean' ? raw['checkoutEnabled'] : true,
    paymentsEnabled: typeof raw['paymentsEnabled'] === 'boolean' ? raw['paymentsEnabled'] : true,
    headline:
      typeof raw['headline'] === 'string' && raw['headline'].trim()
        ? raw['headline']
        : defaultServiceControlConfig.headline,
    maintenanceNotice:
      typeof raw['maintenanceNotice'] === 'string' && raw['maintenanceNotice'].trim()
        ? raw['maintenanceNotice']
        : defaultServiceControlConfig.maintenanceNotice
  };
}
