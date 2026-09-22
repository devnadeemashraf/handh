import type { OAuthUserProfile, SSOProviderType } from '@hh/domain';

export type { OAuthUserProfile, SSOProviderType };

export interface SSOProvider {
  readonly id: SSOProviderType;
  readonly name: string;
  getAuthorizationUrl(state: string, redirectUri: string): string;
  exchangeCodeForProfile(code: string, redirectUri: string): Promise<OAuthUserProfile>;
  isEmailAuthorized(email: string): boolean;
}

export interface SSOConfig {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  zoho?: {
    clientId: string;
    clientSecret: string;
    domain?: string; // e.g. accounts.zoho.in (default) or accounts.zoho.com
  };
  allowedDomains: string[];
  allowedEmails: string[];
}
