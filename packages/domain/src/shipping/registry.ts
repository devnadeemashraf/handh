import { ManualShippingAdapter } from './adapters/manual.adapter';
import { ShiprocketAdapter, type ShiprocketAdapterConfig } from './adapters/shiprocket.adapter';
import {
  TrackingMoreAdapter,
  type TrackingMoreAdapterConfig
} from './adapters/trackingmore.adapter';

import type { ShippingProviderAdapter } from './adapter';

export interface DefaultRegistryConfig {
  manualSecret?: string | undefined;
  shiprocket?: ShiprocketAdapterConfig | undefined;
  trackingmore?: TrackingMoreAdapterConfig | undefined;
}

/**
 * Registry to manage and resolve shipping provider adapters at runtime.
 */
export class ShippingAdapterRegistry {
  private readonly adapters = new Map<string, ShippingProviderAdapter>();

  constructor() {
    // Default manual adapter is always present as safe fallback
    this.register(new ManualShippingAdapter());
  }

  register(adapter: ShippingProviderAdapter): this {
    this.adapters.set(adapter.providerId, adapter);
    return this;
  }

  get(providerId: string): ShippingProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  getOrThrow(providerId: string): ShippingProviderAdapter {
    const adapter = this.get(providerId);
    if (!adapter) {
      throw new Error(`Shipping provider adapter not found for provider ID: '${providerId}'`);
    }
    return adapter;
  }

  list(): ShippingProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  has(providerId: string): boolean {
    return this.adapters.has(providerId);
  }

  /**
   * Evaluates postal code serviceability across configured providers (E-COM-063).
   * Prefers the specified provider, then Shiprocket, then Manual fallback.
   */
  async checkServiceability(
    request: import('./types').ServiceabilityRequest,
    preferredProviderId?: string
  ): Promise<import('./types').ServiceabilityResult> {
    const provider = preferredProviderId
      ? this.get(preferredProviderId)
      : (this.get('shiprocket') ?? this.get('manual'));

    if (provider) {
      return provider.checkServiceability(request);
    }

    const fallback = this.list()[0];
    if (fallback) {
      return fallback.checkServiceability(request);
    }

    return {
      isServiceable: false,
      postalCode: request.postalCode,
      providerId: 'none',
      message: 'No shipping providers available to verify serviceability.'
    };
  }

  static createDefault(config: DefaultRegistryConfig = {}): ShippingAdapterRegistry {
    const registry = new ShippingAdapterRegistry();

    registry.register(new ManualShippingAdapter({ webhookSecret: config.manualSecret }));

    if (config.shiprocket) {
      registry.register(new ShiprocketAdapter(config.shiprocket));
    }

    if (config.trackingmore) {
      registry.register(new TrackingMoreAdapter(config.trackingmore));
    }

    return registry;
  }
}
