import { describe, expect, it } from 'vitest';

import { OTP_CONFIG, SESSION_CONFIG } from '@hh/domain';

import {
  generateOTP,
  generateSessionToken,
  getSessionExpiry,
  hashSessionToken,
  isOTPExpired,
  isSessionExpired,
  verifyOTP
} from './services/auth.service';

describe('Server Auth Crypto Service', () => {
  describe('OTP Generation and Verification', () => {
    it('generates a 6-digit numeric string', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(OTP_CONFIG.length);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('generates different OTPs on successive calls', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      const otp3 = generateOTP();
      expect(otp1 === otp2 && otp2 === otp3).toBe(false);
    });

    it('verifies valid OTP in constant time', () => {
      expect(verifyOTP('123456', '123456')).toBe(true);
      expect(verifyOTP('999999', '999999')).toBe(true);
    });

    it('rejects incorrect OTPs', () => {
      expect(verifyOTP('123456', '654321')).toBe(false);
      expect(verifyOTP('000000', '123456')).toBe(false);
      expect(verifyOTP('', '123456')).toBe(false);
      expect(verifyOTP('12345', '123456')).toBe(false);
      expect(verifyOTP('1234567', '123456')).toBe(false);
    });

    it('detects OTP expiry accurately', () => {
      const past = new Date(Date.now() - 1000);
      const future = new Date(Date.now() + 5 * 60 * 1000);

      expect(isOTPExpired(past)).toBe(true);
      expect(isOTPExpired(past.toISOString())).toBe(true);
      expect(isOTPExpired(future)).toBe(false);
      expect(isOTPExpired(future.toISOString())).toBe(false);
    });
  });

  describe('Session Token Generation, Hashing and Expiry', () => {
    it('generates a cryptographically strong session token', () => {
      const token = generateSessionToken();
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThanOrEqual(32);
    });

    it('hashes session tokens deterministically to SHA-256 hex string', () => {
      const token = 'sample_session_token_xyz_123';
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // 256 bits = 64 hex characters
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });

    it('computes distinct expiry windows for customer vs admin', () => {
      const before = Date.now();
      const customerExpiry = getSessionExpiry('customer');
      const adminExpiry = getSessionExpiry('admin');

      const customerTtl = customerExpiry.getTime() - before;
      const adminTtl = adminExpiry.getTime() - before;

      expect(Math.abs(customerTtl - SESSION_CONFIG.customerTtlMs)).toBeLessThan(1000);
      expect(Math.abs(adminTtl - SESSION_CONFIG.adminTtlMs)).toBeLessThan(1000);
    });

    it('evaluates session expiration correctly', () => {
      const past = new Date(Date.now() - 5000);
      const future = new Date(Date.now() + 60000);

      expect(isSessionExpired(past)).toBe(true);
      expect(isSessionExpired(future)).toBe(false);
    });
  });
});
