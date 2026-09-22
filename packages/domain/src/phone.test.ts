import { describe, expect, it } from 'vitest';

import {
  AuthPhoneSchema,
  extractIndianPhoneDigits,
  formatIndianPhoneDisplay,
  IndianPhoneSchema,
  isValidIndianPhone,
  normalizeIndianPhone
} from './phone';

describe('Canonical Indian Phone Utilities and Schemas', () => {
  describe('extractIndianPhoneDigits', () => {
    it('extracts digits from raw 10-digit numbers', () => {
      expect(extractIndianPhoneDigits('9876543210')).toBe('9876543210');
      expect(extractIndianPhoneDigits('8123456789')).toBe('8123456789');
      expect(extractIndianPhoneDigits('7000000000')).toBe('7000000000');
      expect(extractIndianPhoneDigits('6234567890')).toBe('6234567890');
    });

    it('extracts digits from +91 prefixed numbers', () => {
      expect(extractIndianPhoneDigits('+919876543210')).toBe('9876543210');
      expect(extractIndianPhoneDigits('+91 98765 43210')).toBe('9876543210');
      expect(extractIndianPhoneDigits('+91-98765-43210')).toBe('9876543210');
    });

    it('extracts digits from 91 prefixed numbers without plus', () => {
      expect(extractIndianPhoneDigits('919876543210')).toBe('9876543210');
      expect(extractIndianPhoneDigits('91 9876543210')).toBe('9876543210');
    });

    it('extracts digits from 0-prefixed numbers (STD/trunk format)', () => {
      expect(extractIndianPhoneDigits('09876543210')).toBe('9876543210');
    });

    it('extracts digits from 0091 international prefixed numbers', () => {
      expect(extractIndianPhoneDigits('00919876543210')).toBe('9876543210');
    });

    it('returns empty string for invalid mobile numbers', () => {
      expect(extractIndianPhoneDigits('1234567890')).toBe(''); // Does not start with 6-9
      expect(extractIndianPhoneDigits('987654321')).toBe(''); // 9 digits
      expect(extractIndianPhoneDigits('98765432100')).toBe(''); // 11 digits without 0
      expect(extractIndianPhoneDigits('')).toBe('');
      expect(extractIndianPhoneDigits('invalid')).toBe('');
    });
  });

  describe('normalizeIndianPhone', () => {
    it('normalizes various valid phone formats to canonical E.164 (+91XXXXXXXXXX)', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone(' 9876543210 ')).toBe('+919876543210');
      expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('09876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
      expect(normalizeIndianPhone('00919876543210')).toBe('+919876543210');
    });

    it('returns trimmed string for invalid phones without throwing', () => {
      expect(normalizeIndianPhone('invalid')).toBe('invalid');
      expect(normalizeIndianPhone('12345')).toBe('12345');
    });
  });

  describe('formatIndianPhoneDisplay', () => {
    it('formats phone numbers for clean human display', () => {
      expect(formatIndianPhoneDisplay('9876543210')).toBe('+91 98765 43210');
      expect(formatIndianPhoneDisplay('+919876543210')).toBe('+91 98765 43210');
      expect(formatIndianPhoneDisplay('09876543210')).toBe('+91 98765 43210');
    });

    it('handles fallback gracefully', () => {
      expect(formatIndianPhoneDisplay('test')).toBe('test');
    });
  });

  describe('isValidIndianPhone', () => {
    it('accurately identifies valid and invalid numbers', () => {
      expect(isValidIndianPhone('9876543210')).toBe(true);
      expect(isValidIndianPhone('+919876543210')).toBe(true);
      expect(isValidIndianPhone('09876543210')).toBe(true);
      expect(isValidIndianPhone('1234567890')).toBe(false);
      expect(isValidIndianPhone('987654321')).toBe(false);
    });
  });

  describe('IndianPhoneSchema and AuthPhoneSchema Equivalence', () => {
    it('validates raw 10-digit numbers and transforms to E.164', () => {
      const parsed = IndianPhoneSchema.parse('9876543210');
      expect(parsed).toBe('+919876543210');

      const authParsed = AuthPhoneSchema.parse('9876543210');
      expect(authParsed).toBe('+919876543210');
    });

    it('accepts numbers already prefixed with +91', () => {
      expect(IndianPhoneSchema.parse('+919876543210')).toBe('+919876543210');
      expect(AuthPhoneSchema.parse('+919876543210')).toBe('+919876543210');
    });

    it('accepts 0-prefixed, 91-prefixed, and spaced numbers', () => {
      expect(IndianPhoneSchema.parse('09876543210')).toBe('+919876543210');
      expect(IndianPhoneSchema.parse('919876543210')).toBe('+919876543210');
      expect(IndianPhoneSchema.parse('+91 98765 43210')).toBe('+919876543210');
    });

    it('rejects numbers starting with invalid digits (0-5)', () => {
      expect(() => IndianPhoneSchema.parse('1234567890')).toThrow();
      expect(() => IndianPhoneSchema.parse('5123456789')).toThrow();
      expect(() => AuthPhoneSchema.parse('1234567890')).toThrow();
    });

    it('rejects numbers with wrong length', () => {
      expect(() => IndianPhoneSchema.parse('987654321')).toThrow(); // 9 digits
      expect(() => IndianPhoneSchema.parse('98765432100')).toThrow(); // 11 digits
      expect(() => IndianPhoneSchema.parse('12345')).toThrow();
      expect(() => IndianPhoneSchema.parse('98765ABCD0')).toThrow();
    });
  });
});
