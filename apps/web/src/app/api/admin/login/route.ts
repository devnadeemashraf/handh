import { NextResponse } from 'next/server';

import { createAdminSessionToken, verifyAdminAccessKey, verifyAdminPassword } from '@hh/db';

import {
  ADMIN_COOKIE_NAME,
  checkAdminRateLimit,
  getAdminSecrets,
  recordAdminAuthFailure,
  resetAdminAuthFailures
} from '../../../../lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  // 1. Rate Limiting Check
  const rateLimit = checkAdminRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many failed attempts. Access locked for ${rateLimit.retryAfterSeconds ?? 900} seconds.`
      },
      { status: 429 }
    );
  }

  try {
    const json = await request.json();
    const { password, key } = json ?? {};

    const {
      sessionSecret,
      password: expectedPassword,
      accessKey: expectedAccessKey
    } = getAdminSecrets();

    const isKeyValid = typeof key === 'string' && verifyAdminAccessKey(key, expectedAccessKey);
    const isPasswordValid =
      typeof password === 'string' && verifyAdminPassword(password, expectedPassword);

    if (!isKeyValid || !isPasswordValid) {
      recordAdminAuthFailure(ip);
      // Artificial delay to prevent brute-force timing attacks
      await new Promise((resolve) => setTimeout(resolve, 600));

      return NextResponse.json(
        { success: false, error: 'Invalid access credentials.' },
        { status: 401 }
      );
    }

    // Success: Reset failures & issue signed token
    resetAdminAuthFailures(ip);
    const token = createAdminSessionToken(sessionSecret, 12);

    const response = NextResponse.json({ success: true });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 500 });
  }
}
