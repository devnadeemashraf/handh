import {
  isInstagramTraffic,
  type OrderAttribution,
  orderAttributionSchema,
  parseUtmParameters} from '@hh/domain';

const ATTRIBUTION_STORAGE_KEY = 'hh_attribution_v1';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day attribution window

interface StoredAttributionData {
  attribution: OrderAttribution;
  storedAt: number;
}

/**
 * Parses UTM, Instagram, or direct attribution from the current browser window
 * and persists it to localStorage.
 */
export function captureAttributionFromBrowser(): OrderAttribution | null {
  if (typeof window === 'undefined') return null;

  const currentSearch = window.location.search;
  const referrer = document.referrer || '';
  const userAgent = navigator.userAgent || '';

  const searchParams = new URLSearchParams(currentSearch);
  const parsed = parseUtmParameters(searchParams, {
    referrer,
    userAgent,
    landingPage: window.location.pathname
  });

  // If there are no UTM params and not Instagram and no referrer, keep existing attribution if present
  const isIg = isInstagramTraffic(referrer, userAgent);
  const hasUtm = currentSearch.includes('utm_') || currentSearch.includes('igshid');

  if (!hasUtm && !isIg && !referrer) {
    return getStoredAttribution();
  }

  // Save parsed attribution
  try {
    const data: StoredAttributionData = {
      attribution: parsed,
      storedAt: Date.now()
    };
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to store attribution in localStorage:', e);
  }

  return parsed;
}

/**
 * Retrieves the currently active attribution payload, validating TTL (30 days).
 */
export function getStoredAttribution(): OrderAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;

    const data: StoredAttributionData = JSON.parse(raw);
    if (Date.now() - data.storedAt > ATTRIBUTION_TTL_MS) {
      clearStoredAttribution();
      return null;
    }

    const validation = orderAttributionSchema.safeParse(data.attribution);
    if (!validation.success) {
      clearStoredAttribution();
      return null;
    }

    return validation.data;
  } catch {
    return null;
  }
}

/**
 * Clears stored attribution once an order has been successfully placed.
 */
export function clearStoredAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}
