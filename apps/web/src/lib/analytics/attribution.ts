import {
  isInstagramTraffic,
  type OrderAttribution,
  orderAttributionSchema,
  parseUtmParameters
} from '@hh/domain';

const ATTRIBUTION_STORAGE_KEY = 'hh_attribution_v1';
const ATTRIBUTION_COOKIE_ENDPOINT = '/api/analytics/attribution';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day attribution window

interface StoredAttributionData {
  attribution: OrderAttribution;
  storedAt: number;
}

/**
 * Fire-and-forget: sends attribution to the server so it can be stored as an
 * HTTP-only, first-party cookie that survives Safari WebKit ITP 7-day
 * localStorage purges (E-COM-110, E-COM-111).
 */
function persistAttributionViaCookie(data: StoredAttributionData): void {
  if (typeof fetch !== 'function') return;
  fetch(ATTRIBUTION_COOKIE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'same-origin',
    keepalive: true
  }).catch(() => {
    // Non-blocking — localStorage is still the primary read path
  });
}

/**
 * Parses UTM, Instagram, or direct attribution from the current browser window.
 * Dual-writes to localStorage (immediate reads) AND an HTTP-only first-party
 * cookie via /api/analytics/attribution (Safari WebKit ITP resilience).
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

  const data: StoredAttributionData = {
    attribution: parsed,
    storedAt: Date.now()
  };

  // Primary: persist to localStorage for immediate synchronous reads
  try {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to store attribution in localStorage:', e);
  }

  // Secondary: async cookie write for Safari WebKit ITP resilience
  persistAttributionViaCookie(data);

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
 * Also invalidates the HTTP-only attribution cookie (fire-and-forget).
 */
export function clearStoredAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }
  // Best-effort HTTP-only cookie clearance
  if (typeof fetch === 'function') {
    fetch(ATTRIBUTION_COOKIE_ENDPOINT, {
      method: 'DELETE',
      credentials: 'same-origin',
      keepalive: true
    }).catch(() => {});
  }
}
