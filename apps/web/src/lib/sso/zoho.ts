import { isEmailAuthorizedForAdmin } from '@hh/domain';

import type { OAuthUserProfile, SSOProvider } from './types';

export interface ZohoProviderOptions {
  clientId: string;
  clientSecret: string;
  accountsDomain?: string | undefined; // 'accounts.zoho.in' or 'accounts.zoho.com'
  allowedDomains: string[];
  allowedEmails: string[];
}

export class ZohoOAuthProvider implements SSOProvider {
  readonly id = 'zoho' as const;
  readonly name = 'Zoho Mail';

  private clientId: string;
  private clientSecret: string;
  private accountsDomain: string;
  private allowedDomains: string[];
  private allowedEmails: string[];

  constructor(options: ZohoProviderOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.accountsDomain = options.accountsDomain ?? 'accounts.zoho.in';
    this.allowedDomains = options.allowedDomains;
    this.allowedEmails = options.allowedEmails;
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL(`https://${this.accountsDomain}/oauth/v2/auth`);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'AaaServer.profile.Read');
    url.searchParams.set('state', state);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return url.toString();
  }

  async exchangeCodeForProfile(code: string, redirectUri: string): Promise<OAuthUserProfile> {
    const tokenResponse = await fetch(`https://${this.accountsDomain}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange Zoho OAuth code: ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };

    const userInfoResponse = await fetch(`https://${this.accountsDomain}/oauth/user/info`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to retrieve user profile from Zoho.');
    }

    const profile = (await userInfoResponse.json()) as {
      ZUID?: string;
      id?: string;
      Email: string;
      Display_Name?: string;
      First_Name?: string;
      Last_Name?: string;
    };

    const fullName = [profile.First_Name, profile.Last_Name].filter(Boolean).join(' ');
    const name = profile.Display_Name || fullName || profile.Email.split('@')[0] || 'Admin';

    return {
      id: profile.ZUID ?? profile.id ?? profile.Email,
      email: profile.Email,
      name,
      emailVerified: true
    };
  }

  isEmailAuthorized(email: string): boolean {
    return isEmailAuthorizedForAdmin(email, this.allowedDomains, this.allowedEmails);
  }
}
