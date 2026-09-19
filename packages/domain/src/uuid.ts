/**
 * RFC 4122 v4 UUID format regex.
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a value is a valid RFC 4122 v4 UUID string.
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Fallback UUID v4 generator using timestamp, high-resolution performance timer, and Math.random entropy.
 */
function generateFallbackUUID(): string {
  let d = Date.now();
  let d2 =
    (typeof performance !== 'undefined' &&
      typeof performance.now === 'function' &&
      performance.now() * 1000) ||
    0;

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16;
    if (d > 0) {
      r = ((d + r) % 16) | 0;
      d = Math.floor(d / 16);
    } else if (d2 > 0) {
      r = ((d2 + r) % 16) | 0;
      d2 = Math.floor(d2 / 16);
    } else {
      r = (Math.random() * 16) | 0;
    }
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Generates an RFC 4122 compliant UUID v4 string.
 *
 * Resilient across all execution environments:
 * 1. Native `crypto.randomUUID()` in Node.js and Secure Browser Contexts (HTTPS / localhost).
 * 2. `crypto.getRandomValues()` in non-secure browser contexts where randomUUID is disabled.
 * 3. Pure JavaScript entropy fallback when crypto APIs are unavailable.
 */
export function generateUUID(): string {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Fall through to secondary options if randomUUID fails for any reason
    }
  }

  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    try {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      // Set version 4 (0100)
      bytes[6] = (bytes[6]! & 0x0f) | 0x40;
      // Set variant 10xx
      bytes[8] = (bytes[8]! & 0x3f) | 0x80;

      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    } catch {
      // Fall through to pure JS fallback
    }
  }

  return generateFallbackUUID();
}
