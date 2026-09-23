import { z } from 'zod';

export const SHIPPING_PROVIDER_IDS = ['manual', 'shiprocket', 'trackingmore', 'delhivery'] as const;
export type ShippingProviderId = (typeof SHIPPING_PROVIDER_IDS)[number];
export const ShippingProviderIdSchema = z.enum(SHIPPING_PROVIDER_IDS);

export const NORMALIZED_TRACKING_STATUSES = [
  'manifested',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'rto'
] as const;

export type NormalizedTrackingStatus = (typeof NORMALIZED_TRACKING_STATUSES)[number];
export const NormalizedTrackingStatusSchema = z.enum(NORMALIZED_TRACKING_STATUSES);

export interface NormalizedTrackingEvent {
  awb: string;
  providerId: string;
  status: NormalizedTrackingStatus;
  timestamp: Date;
  location?: string | undefined;
  description?: string | undefined;
  rawPayload: Record<string, unknown>;
}

export interface BookPickupRequest {
  orderId: string;
  orderNumber: string;
  origin: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string | undefined;
  };
  destination: {
    fullName: string;
    phone: string;
    email: string;
    line1: string;
    line2?: string | undefined;
    city: string;
    state: string;
    postalCode: string;
    country?: string | undefined;
  };
  package: {
    weightGrams: number;
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    declaredValueMinor: number;
  };
}

export interface BookPickupResult {
  awb: string;
  courierName: string;
  labelUrl?: string | undefined;
  pickupToken?: string | undefined;
  estimatedDeliveryDate?: string | undefined;
}

export interface RegisterCounterAwbRequest {
  awb: string;
  courierSlug: string;
  orderNumber?: string | undefined;
  customerPhone?: string | undefined;
}

export interface RegisterCounterAwbResult {
  registered: boolean;
  providerId: string;
  trackingUrl?: string | undefined;
}

export const BookPickupInputSchema = z.object({
  providerId: z.enum(['shiprocket', 'delhivery', 'manual']).default('shiprocket'),
  weightGrams: z.number().int().positive().default(200),
  lengthCm: z.number().int().positive().default(15),
  widthCm: z.number().int().positive().default(10),
  heightCm: z.number().int().positive().default(5),
  notes: z.string().max(500).optional()
});

export type BookPickupInput = z.infer<typeof BookPickupInputSchema>;

export const ServiceabilityRequestSchema = z.object({
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code'),
  cod: z.boolean().optional(),
  weightGrams: z.number().int().positive().optional()
});

export type ServiceabilityRequest = z.infer<typeof ServiceabilityRequestSchema>;

export interface ServiceabilityResult {
  isServiceable: boolean;
  postalCode: string;
  providerId: string;
  city?: string | undefined;
  state?: string | undefined;
  estimatedDaysMin?: number | undefined;
  estimatedDaysMax?: number | undefined;
  codAvailable?: boolean | undefined;
  message?: string | undefined;
}
