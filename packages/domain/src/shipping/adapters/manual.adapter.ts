import { type CourierProvider, resolveCourierTrackingUrl } from '../../fulfillment';

import type { ShippingProviderAdapter } from '../adapter';
import type {
  NormalizedTrackingEvent,
  NormalizedTrackingStatus,
  RegisterCounterAwbRequest,
  RegisterCounterAwbResult
} from '../types';

export interface ManualAdapterConfig {
  webhookSecret?: string | undefined;
}

/**
 * Manual / Local Shipping Adapter.
 * Serves as the zero-dependency fallback for physical walk-in bookings at local
 * DTDC / India Post facilities, local deliveries, and testing environments.
 */
export class ManualShippingAdapter implements ShippingProviderAdapter {
  readonly providerId = 'manual';
  readonly name = 'Manual & Counter Dispatch (DTDC / India Post / Local)';
  readonly supportsDoorstepPickup = false;
  readonly supportsCounterDropoffTracking = true;

  constructor(private readonly config: ManualAdapterConfig = {}) {}

  async registerCounterAwb(request: RegisterCounterAwbRequest): Promise<RegisterCounterAwbResult> {
    const trackingUrl = resolveCourierTrackingUrl(
      request.courierSlug as CourierProvider,
      request.awb
    );

    return {
      registered: true,
      providerId: this.providerId,
      ...(trackingUrl ? { trackingUrl } : {})
    };
  }

  verifyWebhookSignature(_rawBody: string, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret) {
      // In development or when no secret is configured, allow simulation
      return true;
    }

    const providedSecret =
      headers['x-manual-webhook-secret'] ||
      headers['x-webhook-secret'] ||
      headers['authorization']?.replace(/^Bearer\s+/i, '');

    return providedSecret === this.config.webhookSecret;
  }

  parseWebhookPayload(rawBody: string): NormalizedTrackingEvent {
    const data = JSON.parse(rawBody) as {
      awb: string;
      status: NormalizedTrackingStatus;
      location?: string;
      description?: string;
      timestamp?: string;
    };

    if (!data.awb || !data.status) {
      throw new Error("Invalid manual webhook payload: 'awb' and 'status' are required");
    }

    return {
      awb: data.awb.trim(),
      providerId: this.providerId,
      status: data.status,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      location: data.location,
      description: data.description,
      rawPayload: data as unknown as Record<string, unknown>
    };
  }
}
