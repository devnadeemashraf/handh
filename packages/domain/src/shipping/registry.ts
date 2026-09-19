import type { ShippingProviderAdapter } from './adapter';
import { ManualShippingAdapter } from './adapters/manual.adapter';
import { ShiprocketAdapter, type ShiprocketAdapterConfig } from './adapters/shiprocket.adapter';
import {
  TrackingMoreAdapter,
  type TrackingMoreAdapterConfig
} from './adapters/trackingmore.adapter';

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
