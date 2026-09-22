import { NextResponse } from 'next/server';
import { getAdminSecrets } from '@/lib/admin-auth';
import { createOAuthState, getSSOProvider } from '@/lib/sso';

import type { SSOProviderType } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const url = new URL(request.url);
  const returnTo = url.searchParams.get('returnTo') ?? '/admin/orders';

  if (provider !== 'google' && provider !== 'zoho') {
    return NextResponse.json(
      { success: false, error: 'Unsupported SSO provider.' },
      { status: 400 }
    );
  }

  const ssoProvider = getSSOProvider(provider as SSOProviderType);
  if (!ssoProvider) {
    return NextResponse.json(
      {
        success: false,
        error: `${provider} SSO is not configured on this environment. Please configure environment variables or use password login.`
      },
      { status: 501 }
    );
  }

  const { sessionSecret } = getAdminSecrets();
  const state = createOAuthState(provider as SSOProviderType, sessionSecret, returnTo);

  const baseUrl =
    process.env['NEXT_PUBLIC_APP_URL'] ?? process.env['APP_URL'] ?? `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/api/admin/auth/oauth/${provider}/callback`;

  const authUrl = ssoProvider.getAuthorizationUrl(state, redirectUri);
  return NextResponse.redirect(authUrl);
}
