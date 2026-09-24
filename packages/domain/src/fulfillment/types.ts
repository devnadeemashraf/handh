import { z } from 'zod';

export const COURIER_PROVIDERS = ['india_post', 'dtdc', 'delhivery', 'bluedart', 'other'] as const;

export type CourierProvider = (typeof COURIER_PROVIDERS)[number];

export const CourierProviderSchema = z.enum(COURIER_PROVIDERS);

export const COURIER_LABELS: Readonly<Record<CourierProvider, string>> = {
  india_post: 'India Post (Speed Post)',
  dtdc: 'DTDC Express',
  delhivery: 'Delhivery',
  bluedart: 'Blue Dart',
  other: 'Other / Local Courier'
};

export const CreateFulfillmentRequestSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  courierProvider: CourierProviderSchema,
  trackingNumber: z
    .string()
    .min(3, 'Tracking number must be at least 3 characters long')
    .max(128, 'Tracking number cannot exceed 128 characters')
    .trim(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
});

export type CreateFulfillmentRequest = z.infer<typeof CreateFulfillmentRequestSchema>;

/**
 * Strict allowlist of trusted external courier hostnames to prevent open-redirect vulnerabilities.
 */
export const ALLOWLISTED_COURIER_HOSTS: readonly string[] = [
  'www.indiapost.gov.in',
  'indiapost.gov.in',
  'www.dtdc.in',
  'dtdc.in',
  'tracking.dtdc.com',
  'www.delhivery.com',
  'delhivery.com',
  'www.bluedart.com',
  'bluedart.com'
];

/**
 * Resolves the official external tracking portal URL for supported couriers.
 * Returns null if the courier is 'other' or does not have a public query link.
 */
export function resolveCourierTrackingUrl(
  provider: CourierProvider,
  trackingNumber: string
): string | null {
  const sanitizedAwb = encodeURIComponent(trackingNumber.trim());

  switch (provider) {
    case 'india_post':
      // India Post Consignment Tracking Portal
      return 'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx';

    case 'dtdc':
      return `https://www.dtdc.in/tracking/shipment-tracking.asp?search_type=AWB&strTrackingNo=${sanitizedAwb}`;

    case 'delhivery':
      return `https://www.delhivery.com/track/package/${sanitizedAwb}`;

    case 'bluedart':
      return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${sanitizedAwb}`;

    case 'other':
      return null;
  }
}

/**
 * Validates that a tracking URL belongs strictly to an authorized courier domain.
 */
export function isAllowlistedCourierUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    return ALLOWLISTED_COURIER_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

/**
 * Generates a human-friendly, collision-resistant tracking reference: TRK-YYYY-XXXXX
 */
export function generateTrackingReference(prefix = 'TRK'): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${year}-${random}`;
}

export const ReturnReceiveSchema = z.object({
  note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
  restock: z.boolean().default(true)
});

export type ReturnReceiveInput = z.infer<typeof ReturnReceiveSchema>;
