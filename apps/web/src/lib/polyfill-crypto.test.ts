import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { isValidUUID } from '@hh/domain';

import { ensureCryptoPolyfill } from './polyfill-crypto';

describe('ensureCryptoPolyfill', () => {
  const originalCrypto = window.crypto;

  beforeEach(() => {
    // Reset window.crypto
    Object.defineProperty(window, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true
    });
  });

  it('polyfils window.crypto and randomUUID when crypto is undefined', () => {
    expect(window.crypto).toBeUndefined();

    ensureCryptoPolyfill();

    expect(window.crypto).toBeDefined();
    expect(typeof window.crypto.randomUUID).toBe('function');

    const id = window.crypto.randomUUID();
    expect(isValidUUID(id)).toBe(true);
  });

  it('polyfils randomUUID when crypto exists but randomUUID is missing (non-secure context)', () => {
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: (buf: Uint8Array) => buf
      },
      writable: true,
      configurable: true
    });

    expect(window.crypto.randomUUID).toBeUndefined();

    ensureCryptoPolyfill();

    expect(typeof window.crypto.randomUUID).toBe('function');
    const id = window.crypto.randomUUID();
    expect(isValidUUID(id)).toBe(true);
  });
});
