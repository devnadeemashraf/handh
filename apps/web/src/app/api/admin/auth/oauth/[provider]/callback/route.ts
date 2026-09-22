import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminSecrets, getSharedDb } from '@/lib/admin-auth';
import { getClientIp } from '@/lib/client-ip';
import { getSSOProvider, verifyOAuthState } from '@/lib/sso';

import {
  createAdminSession,
  createAdminUser,
  findAdminUserByEmail,
  generateAdminSessionToken,
  recordAdminAuditLog,
  stores,
  updateAdminLastLogin
} from '@hh/db';

import type { SSOProviderType } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  const loginPageUrl = new URL('/admin/login', request.url);

  if (errorParam) {
    loginPageUrl.searchParams.set('error', `SSO failed: ${errorParam}`);
    return NextResponse.redirect(loginPageUrl);
  }

  if (!code || !stateParam) {
    loginPageUrl.searchParams.set('error', 'Missing authorization code or state.');
    return NextResponse.redirect(loginPageUrl);
  }

  if (provider !== 'google' && provider !== 'zoho') {
    loginPageUrl.searchParams.set('error', 'Unsupported SSO provider.');
    return NextResponse.redirect(loginPageUrl);
  }

  const { sessionSecret } = getAdminSecrets();
  const oauthState = verifyOAuthState(stateParam, sessionSecret);

  if (!oauthState || oauthState.provider !== provider) {
    loginPageUrl.searchParams.set('error', 'Invalid or expired OAuth state token.');
    return NextResponse.redirect(loginPageUrl);
  }

  const ssoProvider = getSSOProvider(provider as SSOProviderType);
  if (!ssoProvider) {
    loginPageUrl.searchParams.set('error', `${provider} SSO is not configured.`);
    return NextResponse.redirect(loginPageUrl);
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? null;
  const db = getSharedDb();

  try {
    const baseUrl =
      process.env['NEXT_PUBLIC_APP_URL'] ??
      process.env['APP_URL'] ??
      `${url.protocol}//${url.host}`;
    const redirectUri = `${baseUrl}/api/admin/auth/oauth/${provider}/callback`;

    // 1. Exchange code for user profile
    const profile = await ssoProvider.exchangeCodeForProfile(code, redirectUri);

    // 2. Enforce corporate domain authorization
    if (!ssoProvider.isEmailAuthorized(profile.email)) {
      await recordAdminAuditLog(db, {
        adminId: null,
        adminEmail: profile.email,
        action: 'admin:oauth_login_unauthorized_domain',
        entityType: 'admin_user',
        entityId: null,
        details: { provider, attemptedEmail: profile.email },
        ipAddress: ip,
        userAgent
      });

      loginPageUrl.searchParams.set(
        'error',
        `Access denied: ${profile.email} is not authorized for workshop operations.`
      );
      return NextResponse.redirect(loginPageUrl);
    }

    // 3. Find or provision admin user
    let admin = await findAdminUserByEmail(db, profile.email);
    if (!admin) {
      const [store] = await db.select({ id: stores.id }).from(stores).limit(1);
      if (!store) {
        throw new Error('No default store configured for admin provisioning.');
      }

      admin = await createAdminUser(db, {
        storeId: store.id,
        email: profile.email,
        name: profile.name,
        passwordHash: null, // SSO-only account
        role: 'admin',
        isActive: true,
        failedLoginAttempts: 0
      });

      await recordAdminAuditLog(db, {
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'admin:provisioned_via_oauth',
        entityType: 'admin_user',
        entityId: admin.id,
        details: { provider, name: profile.name },
        ipAddress: ip,
        userAgent
      });
    }

    // 4. Validate account status
    if (!admin.isActive) {
      loginPageUrl.searchParams.set('error', 'Your administrator account has been deactivated.');
      return NextResponse.redirect(loginPageUrl);
    }

    // 5. Update last login and issue session
    await updateAdminLastLogin(db, admin.id);

    const { rawToken, tokenHash } = generateAdminSessionToken();
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

    await createAdminSession(db, admin.id, tokenHash, expiresAt, ip, userAgent ?? undefined, 5);

    await recordAdminAuditLog(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'admin:login_success',
      entityType: 'admin_user',
      entityId: admin.id,
      details: { loginMethod: `oauth_${provider}` },
      ipAddress: ip,
      userAgent
    });

    const targetUrl = new URL(oauthState.returnTo ?? '/admin/orders', request.url);
    const response = NextResponse.redirect(targetUrl);

    response.cookies.set(ADMIN_COOKIE_NAME, rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expiresAt,
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('SSO callback processing error:', err);
    loginPageUrl.searchParams.set(
      'error',
      'Failed to complete SSO authentication. Please try again.'
    );
    return NextResponse.redirect(loginPageUrl);
  }
}
