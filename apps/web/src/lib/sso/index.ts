import crypto from 'node:crypto';

import type { OAuthStatePayload, SSOProviderType } from '@hh/domain';

import { GoogleOAuthProvider } from './google';
import { type SSOConfig, type SSOProvider } from './types';
import { ZohoOAuthProvider } from './zoho';

export * from './google';
export * from './types';
export * from './zoho';

export function getSSOConfig(): SSOConfig {
  const allowedDomains = (process.env['ADMIN_ALLOWED_DOMAINS'] ?? 'handh.in')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  const allowedEmails = (process.env['ADMIN_ALLOWED_EMAILS'] ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const googleClientId = process.env['GOOGLE_CLIENT_ID'];
  const googleClientSecret = process.env['GOOGLE_CLIENT_SECRET'];

  const zohoClientId = process.env['ZOHO_CLIENT_ID'];
  const zohoClientSecret = process.env['ZOHO_CLIENT_SECRET'];
  const zohoAccountsDomain = process.env['ZOHO_ACCOUNTS_DOMAIN'] ?? 'accounts.zoho.in';

  return {
    ...(googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {}),
    ...(zohoClientId && zohoClientSecret
      ? {
          zoho: {
            clientId: zohoClientId,
            clientSecret: zohoClientSecret,
            domain: zohoAccountsDomain
          }
        }
      : {}),
    allowedDomains,
    allowedEmails
  };
}

export function getSSOProvider(providerId: SSOProviderType): SSOProvider | null {
  const config = getSSOConfig();

  if (providerId === 'google') {
    if (!config.google) return null;
    return new GoogleOAuthProvider({
      clientId: config.google.clientId,
      clientSecret: config.google.clientSecret,
      allowedDomains: config.allowedDomains,
      allowedEmails: config.allowedEmails
    });
  }

  if (providerId === 'zoho') {
    if (!config.zoho) return null;
    return new ZohoOAuthProvider({
      clientId: config.zoho.clientId,
      clientSecret: config.zoho.clientSecret,
      accountsDomain: config.zoho.domain,
      allowedDomains: config.allowedDomains,
      allowedEmails: config.allowedEmails
    });
  }

  return null;
}

export function createOAuthState(
  provider: SSOProviderType,
  secret: string,
  returnTo = '/admin/orders'
): string {
  const payload: OAuthStatePayload = {
    provider,
    nonce: crypto.randomBytes(16).toString('hex'),
    returnTo,
    createdAt: Date.now()
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadEncoded).digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

export function verifyOAuthState(state: string, secret: string): OAuthStatePayload | null {
  try {
    if (!state || !secret) return null;
    const parts = state.split('.');
    if (parts.length !== 2) return null;

    const [payloadEncoded, signature] = parts;
    if (!payloadEncoded || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadEncoded)
      .digest('base64url');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(signatureBuf, expectedBuf)) return null;

    const json = Buffer.from(payloadEncoded, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as Partial<OAuthStatePayload>;

    if (!payload.provider || typeof payload.createdAt !== 'number') return null;

    // State valid for 10 minutes
    if (Date.now() - payload.createdAt > 10 * 60 * 1000) return null;

    return payload as OAuthStatePayload;
  } catch {
    return null;
  }
}
