import { describe, expect, it } from 'vitest';

import { isEmailAuthorizedForAdmin, isEmailInDomain } from './sso';

describe('SSO Domain Authorization', () => {
  describe('isEmailInDomain', () => {
    it('matches exact corporate domain', () => {
      expect(isEmailInDomain('admin@handh.in', 'handh.in')).toBe(true);
      expect(isEmailInDomain('user.name@brand.com', 'brand.com')).toBe(true);
      expect(isEmailInDomain('USER@BRAND.COM', 'brand.com')).toBe(true);
    });

    it('matches subdomains of corporate domain', () => {
      expect(isEmailInDomain('ops@staff.brand.com', 'brand.com')).toBe(true);
    });

    it('handles leading @ in domain parameter gracefully', () => {
      expect(isEmailInDomain('ceo@brand.com', '@brand.com')).toBe(true);
    });

    it('rejects domains that are only substrings of corporate domain', () => {
      expect(isEmailInDomain('attacker@fakebrand.com', 'brand.com')).toBe(false);
      expect(isEmailInDomain('attacker@brand.com.attacker.com', 'brand.com')).toBe(false);
    });

    it('rejects invalid or empty inputs', () => {
      expect(isEmailInDomain('', 'brand.com')).toBe(false);
      expect(isEmailInDomain('invalid-email', 'brand.com')).toBe(false);
      expect(isEmailInDomain('user@brand.com', '')).toBe(false);
    });
  });

  describe('isEmailAuthorizedForAdmin', () => {
    const allowedDomains = ['handh.in', 'brand.com'];
    const allowedEmails = ['trusted-partner@gmail.com', 'contractor@zoho.com'];

    it('allows emails belonging to allowed corporate domains', () => {
      expect(isEmailAuthorizedForAdmin('ceo@brand.com', allowedDomains, allowedEmails)).toBe(true);
      expect(isEmailAuthorizedForAdmin('ops@handh.in', allowedDomains, allowedEmails)).toBe(true);
    });

    it('allows explicitly whitelisted emails regardless of domain', () => {
      expect(
        isEmailAuthorizedForAdmin('trusted-partner@gmail.com', allowedDomains, allowedEmails)
      ).toBe(true);
      expect(isEmailAuthorizedForAdmin('contractor@zoho.com', allowedDomains, allowedEmails)).toBe(
        true
      );
    });

    it('denies unauthorized emails', () => {
      expect(isEmailAuthorizedForAdmin('intruder@gmail.com', allowedDomains, allowedEmails)).toBe(
        false
      );
      expect(isEmailAuthorizedForAdmin('staff@othercorp.com', allowedDomains, allowedEmails)).toBe(
        false
      );
      expect(isEmailAuthorizedForAdmin('', allowedDomains, allowedEmails)).toBe(false);
    });
  });
});
