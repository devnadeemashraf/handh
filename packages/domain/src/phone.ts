import { z } from 'zod';

/**
 * Extracts 10-digit Indian mobile digits from various formatted strings
 * (e.g., "+919876543210", "9876543210", "09876543210", "919876543210", "+91 98765 43210").
 * Returns an empty string if input does not represent a valid 10-digit Indian mobile number.
 */
export function extractIndianPhoneDigits(input: string): string {
  if (typeof input !== 'string') return '';
  const cleaned = input.trim();
  const digits = cleaned.replace(/\D/g, '');

  // Exactly 10 digits starting with 6, 7, 8, or 9
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return digits;
  }
  // 11 digits starting with 0 followed by 6-9 (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0') && /^0[6-9]/.test(digits)) {
    return digits.slice(1);
  }
  // 12 digits starting with 91 followed by 6-9 (e.g. 919876543210, +919876543210)
  if (digits.length === 12 && digits.startsWith('91') && /^91[6-9]/.test(digits)) {
    return digits.slice(2);
  }
  // 14 digits starting with 0091 followed by 6-9 (e.g. 00919876543210)
  if (digits.length === 14 && digits.startsWith('0091') && /^0091[6-9]/.test(digits)) {
    return digits.slice(4);
  }

  return '';
}

/**
 * Normalizes an Indian mobile phone number into canonical E.164 format (+91XXXXXXXXXX).
 * If the input is not a valid 10-digit Indian number, returns the cleaned string.
 */
export function normalizeIndianPhone(input: string): string {
  const digits = extractIndianPhoneDigits(input);
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return input.trim();
}

/**
 * Formats a phone number for human-readable display (e.g., "+91 98765 43210").
 */
export function formatIndianPhoneDisplay(input: string): string {
  const digits = extractIndianPhoneDigits(input);
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return input.trim();
}

/**
 * Checks whether an input represents a valid 10-digit Indian mobile number.
 */
export function isValidIndianPhone(input: string): boolean {
  return extractIndianPhoneDigits(input).length === 10;
}

/**
 * Canonical Zod schema for Indian mobile phone numbers.
 * Accepts 10-digit raw format, +91 prefixed, 0-prefixed, 91-prefixed, or formatted with spaces/dashes.
 * Automatically transforms valid inputs into canonical E.164 format (+91XXXXXXXXXX).
 */
export const IndianPhoneSchema = z
  .string({ required_error: 'Mobile phone number is required' })
  .trim()
  .transform(normalizeIndianPhone)
  .refine((val) => /^\+91[6-9]\d{9}$/.test(val), {
    message: 'Please enter a valid 10-digit Indian mobile number'
  });

/**
 * Alias to maintain backward compatibility with existing auth references.
 */
export const AuthPhoneSchema = IndianPhoneSchema;
