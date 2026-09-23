import { type CourierProvider, resolveCourierTrackingUrl } from '../../fulfillment';
import { verifySecretTimingSafe } from '../crypto';
import {
  estimateTransitDays,
  getPostalCodeRegion,
  isPostalCodeServiceable,
  validateIndianPostalCode
} from '../pincode';

import type { ShippingProviderAdapter } from '../adapter';
import type {
  NormalizedTrackingEvent,
  NormalizedTrackingStatus,
  RegisterCounterAwbRequest,
  RegisterCounterAwbResult,
  ServiceabilityRequest,
  ServiceabilityResult
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

  async checkServiceability(request: ServiceabilityRequest): Promise<ServiceabilityResult> {
    const validation = validateIndianPostalCode(request.postalCode);
    if (!validation.valid || !validation.normalized) {
      return {
        isServiceable: false,
        postalCode: request.postalCode,
        providerId: this.providerId,
        message: validation.error ?? 'Invalid Indian PIN code format'
      };
    }

    const postalCode = validation.normalized;
    const serviceable = isPostalCodeServiceable(postalCode);

    if (!serviceable) {
      return {
        isServiceable: false,
        postalCode,
        providerId: this.providerId,
        message: `Delivery is currently not available to PIN ${postalCode}.`
      };
    }

    const region = getPostalCodeRegion(postalCode);
    const transit = estimateTransitDays(postalCode);

    return {
      isServiceable: true,
      postalCode,
      providerId: this.providerId,
      state: region?.state,
      estimatedDaysMin: transit.minDays,
      estimatedDaysMax: transit.maxDays,
      codAvailable: true,
      message: 'Standard counter dispatch delivery available.'
    };
  }

  verifyWebhookSignature(_rawBody: string, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret || this.config.webhookSecret.trim() === '') {
      // Fail closed when no secret is configured (E-COM-062)
      return false;
    }

    const providedSecret =
      headers['x-manual-webhook-secret'] ||
      headers['x-webhook-secret'] ||
      headers['authorization']?.replace(/^Bearer\s+/i, '');

    return verifySecretTimingSafe(providedSecret, this.config.webhookSecret);
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
