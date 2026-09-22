import { describe, expect, it } from 'vitest';

import {
  createAdminSessionToken,
  generateAdminSessionToken,
  hashAdminSessionToken,
  hashPassword,
  timingSafeStringEqual,
  verifyAdminAccessKey,
  verifyAdminPassword,
  verifyAdminSessionToken,
  verifyPassword
} from './services/admin-auth.service';

describe('Admin Authentication Service', () => {
  const secret = 'super_secret_session_key_32_characters_minimum';
  const legacyPassword = 'my_super_secure_admin_password_2026';
  const accessKey = 'hh_stealth_gateway_access_key';

  describe('Legacy Password & Access Key Verification', () => {
    it('verifies correct password and rejects incorrect password', () => {
      expect(verifyAdminPassword(legacyPassword, legacyPassword)).toBe(true);
      expect(verifyAdminPassword('wrong_password', legacyPassword)).toBe(false);
      expect(verifyAdminPassword('', legacyPassword)).toBe(false);
    });

    it('verifies correct access key and rejects incorrect key', () => {
      expect(verifyAdminAccessKey(accessKey, accessKey)).toBe(true);
      expect(verifyAdminAccessKey('wrong_key', accessKey)).toBe(false);
      expect(verifyAdminAccessKey('', accessKey)).toBe(false);
    });

    it('compares strings in constant time', () => {
      expect(timingSafeStringEqual('abc', 'abc')).toBe(true);
      expect(timingSafeStringEqual('abc', 'abd')).toBe(false);
      expect(timingSafeStringEqual('abc', 'abcd')).toBe(false);
      expect(timingSafeStringEqual('', 'abc')).toBe(false);
    });
  });

  describe('Enterprise Scrypt Password Hashing & Verification', () => {
    const rawPassword = 'SuperStrongAdminPassword!2026#Secure';

    it('hashes passwords with unique random salts', async () => {
      const hash1 = await hashPassword(rawPassword);
      const hash2 = await hashPassword(rawPassword);

      expect(typeof hash1).toBe('string');
      expect(hash1).toMatch(/^scrypt\$N=16384,r=8,p=1\$[0-9a-f]{64}\$[0-9a-f]{128}$/);
      expect(hash1).not.toBe(hash2); // Different salts ensure unique hashes
    });

    it('correctly verifies plaintext password against scrypt hash', async () => {
      const hash = await hashPassword(rawPassword);
      const isValid = await verifyPassword(rawPassword, hash);
      expect(isValid).toBe(true);
    });

    it('rejects incorrect passwords', async () => {
      const hash = await hashPassword(rawPassword);
      const isValid = await verifyPassword('IncorrectPassword123', hash);
      expect(isValid).toBe(false);
    });

    it('handles corrupted or invalid hashes gracefully without throwing', async () => {
      expect(await verifyPassword(rawPassword, 'not_a_scrypt_hash')).toBe(false);
      expect(await verifyPassword(rawPassword, 'scrypt$invalid_params$123$456')).toBe(false);
      expect(await verifyPassword(rawPassword, '')).toBe(false);
      expect(await verifyPassword('', 'scrypt$N=16384,r=8,p=1$abc$def')).toBe(false);
    });
  });

  describe('Session Token Generation and Storage Hashing', () => {
    it('generates high-entropy session tokens and corresponding sha256 hashes', () => {
      const { rawToken, tokenHash } = generateAdminSessionToken();
      expect(rawToken).toBeTruthy();
      expect(tokenHash).toBeTruthy();
      expect(rawToken.length).toBeGreaterThanOrEqual(40);
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);

      // Verifies hashAdminSessionToken matches
      expect(hashAdminSessionToken(rawToken)).toBe(tokenHash);
    });

    it('generates unique tokens on each invocation', () => {
      const t1 = generateAdminSessionToken();
      const t2 = generateAdminSessionToken();
      expect(t1.rawToken).not.toBe(t2.rawToken);
      expect(t1.tokenHash).not.toBe(t2.tokenHash);
    });
  });

  describe('Cryptographic Signed Tokens (Legacy / Edge)', () => {
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
