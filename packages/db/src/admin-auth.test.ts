import { describe, expect, it } from 'vitest';

import {
  createAdminSessionToken,
  verifyAdminAccessKey,
  verifyAdminPassword,
  verifyAdminSessionToken
} from './services/admin-auth.service';

describe('Admin Authentication Service', () => {
  const secret = 'super_secret_session_key_32_characters_minimum';
  const password = 'my_super_secure_admin_password_2026';
  const accessKey = 'hh_stealth_gateway_access_key';

  describe('Password & Access Key Verification', () => {
    it('verifies correct password and rejects incorrect password', () => {
      expect(verifyAdminPassword(password, password)).toBe(true);
      expect(verifyAdminPassword('wrong_password', password)).toBe(false);
      expect(verifyAdminPassword('', password)).toBe(false);
    });

    it('verifies correct access key and rejects incorrect key', () => {
      expect(verifyAdminAccessKey(accessKey, accessKey)).toBe(true);
      expect(verifyAdminAccessKey('wrong_key', accessKey)).toBe(false);
      expect(verifyAdminAccessKey('', accessKey)).toBe(false);
    });
  });

  describe('Cryptographic Session Tokens', () => {
    it('generates a valid session token that passes verification', () => {
      const token = createAdminSessionToken(secret, 12);
      expect(typeof token).toBe('string');
      expect(token.includes('.')).toBe(true);

      const isValid = verifyAdminSessionToken(token, secret);
      expect(isValid).toBe(true);
    });

    it('rejects a token signed with a different secret', () => {
      const token = createAdminSessionToken(secret, 12);
      const differentSecret = 'completely_different_secret_key_32_chars';
      expect(verifyAdminSessionToken(token, differentSecret)).toBe(false);
    });

    it('strictly rejects tampered tokens', () => {
      const token = createAdminSessionToken(secret, 12);
      const parts = token.split('.');
      const payload = parts[0]!;
      const signature = parts[1]!;

      // Tampered payload
      const tamperedToken = `${payload}X.${signature}`;
      expect(verifyAdminSessionToken(tamperedToken, secret)).toBe(false);

      // Tampered signature
      const tamperedSignature = `${payload}.${signature.slice(0, -2)}AA`;
      expect(verifyAdminSessionToken(tamperedSignature, secret)).toBe(false);
    });

    it('rejects expired tokens', () => {
      // Create a token that expired 1 hour ago (-1 TTL)
      const expiredToken = createAdminSessionToken(secret, -1);
      expect(verifyAdminSessionToken(expiredToken, secret)).toBe(false);
    });
  });
});
