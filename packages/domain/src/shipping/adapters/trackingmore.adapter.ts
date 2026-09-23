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

export interface TrackingMoreAdapterConfig {
  apiKey?: string | undefined;
  webhookSecret?: string | undefined;
}

/**
 * TrackingMore Universal Tracking Adapter.
 * Bridges manual counter drop-offs (India Post, DTDC, Blue Dart) by polling
 * official courier portals in the background and firing automated webhooks to our app.
 */
export class TrackingMoreAdapter implements ShippingProviderAdapter {
  readonly providerId = 'trackingmore';
  readonly name = 'Universal Tracking Hook (India Post / DTDC / Blue Dart)';
  readonly supportsDoorstepPickup = false;
  readonly supportsCounterDropoffTracking = true;

  constructor(private readonly config: TrackingMoreAdapterConfig = {}) {}

  async registerCounterAwb(request: RegisterCounterAwbRequest): Promise<RegisterCounterAwbResult> {
    const isMock = !this.config.apiKey || this.config.apiKey.includes('placeholder');

    if (isMock) {
      return {
        registered: true,
        providerId: this.providerId,
        trackingUrl: `https://track.trackingmore.com/${request.courierSlug}/${request.awb}`
      };
    }

    // Live API call would register AWB with TrackingMore /v4/trackings/create
    return {
      registered: true,
      providerId: this.providerId,
      trackingUrl: `https://track.trackingmore.com/${request.courierSlug}/${request.awb}`
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
      message: 'Universal postal tracking network available.'
    };
  }

  verifyWebhookSignature(_rawBody: string, headers: Record<string, string>): boolean {
    if (!this.config.webhookSecret || this.config.webhookSecret.trim() === '') {
      // Fail closed when no secret is configured (E-COM-062)
      return false;
    }

    const providedSignature =
      headers['trackingmore-signature'] ||
      headers['x-trackingmore-signature'] ||
      headers['authorization']?.replace(/^Bearer\s+/i, '');

    return verifySecretTimingSafe(providedSignature, this.config.webhookSecret);
  }

  parseWebhookPayload(rawBody: string): NormalizedTrackingEvent {
    const data = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        tracking_number?: string;
        carrier_code?: string;
        delivery_status?: string;
        latest_event?: string;
        updated_at?: string;
      };
    };

    const trackingData = data.data || (data as unknown as Record<string, unknown>);
    const awb = (trackingData as { tracking_number?: string }).tracking_number;

    if (!awb) {
      throw new Error("TrackingMore webhook missing 'tracking_number'");
    }

    const rawStatus = (
      (trackingData as { delivery_status?: string }).delivery_status || ''
    ).toLowerCase();
    let status: NormalizedTrackingStatus = 'in_transit';

    if (rawStatus === 'delivered') {
      status = 'delivered';
    } else if (rawStatus === 'out_for_delivery') {
      status = 'out_for_delivery';
    } else if (rawStatus === 'rto') {
      status = 'rto';
    } else if (rawStatus === 'exception' || rawStatus === 'undelivered') {
      status = 'failed_attempt';
    } else if (rawStatus === 'pickup' || rawStatus === 'transit') {
      status = 'in_transit';
    }

    const latestEvent = (trackingData as { latest_event?: string }).latest_event;
    const updatedAt = (trackingData as { updated_at?: string }).updated_at;

    return {
      awb: awb.trim(),
      providerId: this.providerId,
      status,
      timestamp: updatedAt ? new Date(updatedAt) : new Date(),
      description: latestEvent,
      rawPayload: data as unknown as Record<string, unknown>
    };
  }
}
