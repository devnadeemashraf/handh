import { generateUUID } from '@hh/domain';

/**
 * Polyfills `crypto.randomUUID` in browser environments where it is missing,
 * such as non-secure contexts (HTTP on LAN/IP addresses, older mobile WebViews).
 */
export function ensureCryptoPolyfill(): void {
  if (typeof window === 'undefined') return;

  try {
    if (!window.crypto) {
      Object.defineProperty(window, 'crypto', {
        value: {},
        writable: true,
        configurable: true
      });
    }

    if (typeof window.crypto.randomUUID !== 'function') {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: generateUUID,
          writable: true,
          configurable: true
        });
      } catch {
        (window.crypto as { randomUUID?: () => string }).randomUUID = generateUUID;
      }
    }
  } catch {
    // Gracefully handle any browser sandbox restrictions
  }
}

// Auto-run when module is loaded in client
ensureCryptoPolyfill();
