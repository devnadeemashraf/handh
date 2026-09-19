import { describe, expect, it, vi } from 'vitest';

import { generateUUID, isValidUUID, UUID_REGEX } from './uuid';

describe('UUID Generator & Validator', () => {
  it('generates a valid RFC 4122 v4 UUID using default environment', () => {
    const id = generateUUID();
    expect(isValidUUID(id)).toBe(true);
    expect(UUID_REGEX.test(id)).toBe(true);
  });

  it('generates unique UUIDs across successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const id = generateUUID();
      expect(isValidUUID(id)).toBe(true);
      ids.add(id);
    }
    expect(ids.size).toBe(200);
  });

  it('falls back to crypto.getRandomValues when crypto.randomUUID is not available', () => {
    const originalCrypto = globalThis.crypto;

    try {
      // Mock crypto without randomUUID
      const mockGetRandomValues = vi.fn((buffer: Uint8Array) => {
        for (let i = 0; i < buffer.length; i++) {
          buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer;
      });

      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValues
        },
        writable: true,
        configurable: true
      });

      const id = generateUUID();
      expect(mockGetRandomValues).toHaveBeenCalled();
      expect(isValidUUID(id)).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });

  it('falls back to pure JS random entropy when globalThis.crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;

    try {
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const id = generateUUID();
      expect(isValidUUID(id)).toBe(true);
      expect(id).toMatch(UUID_REGEX);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
  });

  it('validates correct and incorrect UUID strings properly', () => {
    expect(isValidUUID('c8c10e11-43d4-4f0e-8d29-c41a790072a3')).toBe(true);
    expect(isValidUUID('00000000-0000-4000-8000-000000000000')).toBe(true);
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(12345)).toBe(false);
    expect(isValidUUID('c8c10e11-43d4-3f0e-8d29-c41a790072a3')).toBe(false); // version 3, not 4
  });
});
