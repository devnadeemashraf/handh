import type {
  BookPickupRequest,
  BookPickupResult,
  NormalizedTrackingEvent,
  RegisterCounterAwbRequest,
  RegisterCounterAwbResult,
  ShippingProviderId
} from './types';

/**
 * Adapter interface for logistics providers.
 * Follows the Adapter Pattern to decouple checkout, fulfillment, and webhook
 * processing from specific courier vendors (Shiprocket, Delhivery, TrackingMore, Manual).
 */
export interface ShippingProviderAdapter {
  readonly providerId: ShippingProviderId;
  readonly name: string;
  readonly supportsDoorstepPickup: boolean;
  readonly supportsCounterDropoffTracking: boolean;

  /**
   * Mode 1: Books online doorstep pickup & generates live AWB + printable label
   */
  bookDoorstepPickup?(request: BookPickupRequest): Promise<BookPickupResult>;

  /**
   * Mode 2: Registers a walk-in / counter AWB (e.g. India Post slip) for automated webhook triggers
   */
  registerCounterAwb?(request: RegisterCounterAwbRequest): Promise<RegisterCounterAwbResult>;

  /**
   * Cryptographically verifies inbound webhook authenticity (HMAC / Secret Token)
   */
  verifyWebhookSignature(rawBody: string, headers: Record<string, string>): boolean;

  /**
   * Parses vendor-specific webhook payload into the standard domain format
   */
  parseWebhookPayload(rawBody: string): NormalizedTrackingEvent;
}
