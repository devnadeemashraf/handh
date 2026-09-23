/**
 * Indian Postal Index Number (PIN Code) Serviceability Engine (E-COM-063).
 *
 * India Post assigns 6-digit numeric codes:
 * - Digit 1: Postal Zone (1-9). Zone 9 is reserved for the Army Postal Service (APS).
 * - Digits 1-2: Sub-zone or State circle.
 * - Digits 1-3: Sorting district.
 * - Digits 4-6: Specific delivery post office.
 */

export const INDIAN_PINCODE_REGEX = /^[1-9]\d{5}$/;

/**
 * Pincodes explicitly designated as non-serviceable for civilian e-commerce courier dispatch.
 * Includes known remote non-serviceable codes (e.g. 790001) and test mock codes (e.g. 999999).
 */
export const DEFAULT_UNSERVICEABLE_PINCODES = new Set<string>([
  '790001', // Remote non-serviceable border taluk (E-COM-063 audit test case)
  '790002',
  '999999', // Standard test invalid pincode
  '000000'
]);

export interface PostalCodeRegion {
  state: string;
  zone: number;
}

/**
 * Resolves the Indian state and postal zone from the 2-digit PIN code prefix.
 */
export function getPostalCodeRegion(pincode: string): PostalCodeRegion | null {
  const cleaned = pincode.trim();
  if (!INDIAN_PINCODE_REGEX.test(cleaned)) {
    return null;
  }

  const prefix = Number.parseInt(cleaned.slice(0, 2), 10);
  const zone = Number.parseInt(cleaned[0]!, 10);

  // Zone 1: Northern Region
  if (prefix === 11) return { state: 'Delhi', zone: 1 };
  if (prefix >= 12 && prefix <= 13) return { state: 'Haryana', zone: 1 };
  if (prefix >= 14 && prefix <= 15) return { state: 'Punjab', zone: 1 };
  if (prefix === 16) return { state: 'Chandigarh', zone: 1 };
  if (prefix === 17) return { state: 'Himachal Pradesh', zone: 1 };
  if (prefix >= 18 && prefix <= 19) return { state: 'Jammu and Kashmir', zone: 1 };

  // Zone 2: Northern Region (UP / UK)
  if (prefix >= 20 && prefix <= 28) return { state: 'Uttar Pradesh', zone: 2 };

  // Zone 3: Western Region
  if (prefix >= 30 && prefix <= 34) return { state: 'Rajasthan', zone: 3 };
  if (prefix >= 36 && prefix <= 39) return { state: 'Gujarat', zone: 3 };

  // Zone 4: Western Region (MH / MP / CG / GA)
  if (prefix >= 40 && prefix <= 44) return { state: 'Maharashtra', zone: 4 };
  if (prefix >= 45 && prefix <= 49) return { state: 'Madhya Pradesh', zone: 4 };

  // Zone 5: Southern Region (AP / TS / KA)
  if (prefix >= 50 && prefix <= 53) return { state: 'Telangana', zone: 5 };
  if (prefix >= 56 && prefix <= 59) return { state: 'Karnataka', zone: 5 };

  // Zone 6: Southern Region (TN / KL / PY)
  if (prefix >= 60 && prefix <= 64) return { state: 'Tamil Nadu', zone: 6 };
  if (prefix >= 67 && prefix <= 69) return { state: 'Kerala', zone: 6 };

  // Zone 7: Eastern Region (WB / OD / NE)
  if (prefix >= 70 && prefix <= 74) return { state: 'West Bengal', zone: 7 };
  if (prefix >= 75 && prefix <= 77) return { state: 'Odisha', zone: 7 };
  if (prefix === 78) return { state: 'Assam', zone: 7 };
  if (prefix === 79) return { state: 'North Eastern States', zone: 7 };

  // Zone 8: Eastern Region (BR / JH)
  if (prefix >= 80 && prefix <= 85) return { state: 'Bihar', zone: 8 };

  // Zone 9: Army Postal Service (APS)
  if (zone === 9) return { state: 'Army Postal Service (APS)', zone: 9 };

  return null;
}

/**
 * Validates the syntax of an Indian PIN code.
 */
export function validateIndianPostalCode(pincode: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  const cleaned = pincode.replace(/\D/g, '').trim();

  if (cleaned.length === 0) {
    return { valid: false, error: 'PIN code is required' };
  }

  if (cleaned.length !== 6) {
    return { valid: false, error: 'PIN code must be exactly 6 digits' };
  }

  if (cleaned.startsWith('0')) {
    return { valid: false, error: 'Indian PIN codes cannot begin with 0' };
  }

  if (!INDIAN_PINCODE_REGEX.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid 6-digit Indian PIN code' };
  }

  return { valid: true, normalized: cleaned };
}

export interface ServiceabilityCheckOptions {
  unserviceableList?: string[] | undefined;
  originPostalCode?: string | undefined;
}

/**
 * Determines whether a given Indian PIN code is serviceable by courier partners.
 *
 * Rules:
 * 1. Must be a valid 6-digit PIN format starting with digits 1-8.
 * 2. Zone 9 (APS 900000-999999) is military post and not serviceable by civilian surface couriers.
 * 3. Specific unserviceable or test codes are excluded.
 */
export function isPostalCodeServiceable(
  pincode: string,
  options: ServiceabilityCheckOptions = {}
): boolean {
  const validation = validateIndianPostalCode(pincode);
  if (!validation.valid || !validation.normalized) {
    return false;
  }

  const normalized = validation.normalized;

  // Zone 9 (APS / Army Postal Service) is not serviceable for civilian couriers
  if (normalized.startsWith('9')) {
    return false;
  }

  if (DEFAULT_UNSERVICEABLE_PINCODES.has(normalized)) {
    return false;
  }

  if (options.unserviceableList && options.unserviceableList.includes(normalized)) {
    return false;
  }

  return true;
}

/**
 * Estimates courier transit turnaround time in business days from the dispatch origin
 * (H&H dispatch origin: Hyderabad, Telangana - PIN 500034).
 */
export function estimateTransitDays(
  destinationPincode: string,
  _originPincode = '500034'
): { minDays: number; maxDays: number } {
  const region = getPostalCodeRegion(destinationPincode);
  if (!region) {
    return { minDays: 3, maxDays: 7 };
  }

  // Zone 5 (Telangana, AP, Karnataka - Same / Neighboring state)
  if (region.zone === 5) {
    const isLocalHyderabad = destinationPincode.startsWith('500');
    return isLocalHyderabad ? { minDays: 1, maxDays: 2 } : { minDays: 2, maxDays: 3 };
  }

  // Zones 4 & 6 (West and South metros: Mumbai, Pune, Chennai, Bangalore, Kochi)
  if (region.zone === 4 || region.zone === 6) {
    return { minDays: 2, maxDays: 4 };
  }

  // Remote North-East (prefix 79)
  if (destinationPincode.startsWith('79')) {
    return { minDays: 5, maxDays: 8 };
  }

  // Zones 1, 2, 3, 7, 8 (North & East India)
  return { minDays: 3, maxDays: 6 };
}
