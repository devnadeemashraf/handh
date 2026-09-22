import { describe, expect, it } from 'vitest';

import { getClientIp } from './client-ip';

describe('getClientIp', () => {
  it('prefers x-real-ip header over x-forwarded-for', () => {
    const headers = new Headers();
    headers.set('x-real-ip', '203.0.113.195');
    headers.set('x-forwarded-for', '198.51.100.1, 10.0.0.1');

    expect(getClientIp(headers)).toBe('203.0.113.195');
  });

  it('prefers cf-connecting-ip if x-real-ip is missing', () => {
    const headers = new Headers();
    headers.set('cf-connecting-ip', '198.51.100.55');
    headers.set('x-forwarded-for', 'client.spoofed.ip, proxy.ip');

    expect(getClientIp(headers)).toBe('198.51.100.55');
  });

  it('selects rightmost IP in x-forwarded-for to prevent spoofing leftmost entry', () => {
    const headers = new Headers();
    headers.set('x-forwarded-for', '1.1.1.1, 2.2.2.2, 203.0.113.50');

    expect(getClientIp(headers)).toBe('203.0.113.50');
  });

  it('falls back to 127.0.0.1 when no IP headers are present', () => {
    const headers = new Headers();
    expect(getClientIp(headers)).toBe('127.0.0.1');
  });
});
