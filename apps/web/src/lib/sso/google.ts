import { isEmailAuthorizedForAdmin } from '@hh/domain';

import type { OAuthUserProfile, SSOProvider } from './types';

export interface GoogleProviderOptions {
  clientId: string;
  clientSecret: string;
  allowedDomains: string[];
  allowedEmails: string[];
}

export class GoogleOAuthProvider implements SSOProvider {
  readonly id = 'google' as const;
  readonly name = 'Google Workspace';

  private clientId: string;
  private clientSecret: string;
  private allowedDomains: string[];
  private allowedEmails: string[];

  constructor(options: GoogleProviderOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.allowedDomains = options.allowedDomains;
    this.allowedEmails = options.allowedEmails;
  }

  getAuthorizationUrl(state: string, redirectUri: string): string {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');

    // If a primary corporate domain is configured, provide hd parameter hint
    if (this.allowedDomains.length === 1 && this.allowedDomains[0]) {
      url.searchParams.set('hd', this.allowedDomains[0]);
    }

    return url.toString();
  }

  async exchangeCodeForProfile(code: string, redirectUri: string): Promise<OAuthUserProfile> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
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
      throw new Error(`Failed to exchange Google OAuth code: ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; id_token?: string };

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to retrieve user profile from Google.');
    }

    const profile = (await userInfoResponse.json()) as {
      sub: string;
      email: string;
      name?: string;
      picture?: string;
      email_verified?: boolean;
      hd?: string;
    };

    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name ?? profile.email.split('@')[0] ?? 'Admin',
      avatarUrl: profile.picture,
      emailVerified: Boolean(profile.email_verified),
      hostedDomain: profile.hd
    };
  }

  isEmailAuthorized(email: string): boolean {
    return isEmailAuthorizedForAdmin(email, this.allowedDomains, this.allowedEmails);
  }
}
