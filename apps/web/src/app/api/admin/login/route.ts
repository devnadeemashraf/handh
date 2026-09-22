import { NextResponse } from 'next/server';

import { authenticateAdminWithPassword } from '@hh/db';
import { AdminLoginSchema } from '@hh/domain';

import {
  ADMIN_COOKIE_NAME,
  checkAdminLoginRateLimit,
  getSharedDb
} from '../../../../lib/admin-auth';
import { getClientIp } from '../../../../lib/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  // 1. Safe IP extraction protecting against X-Forwarded-For spoofing (E-COM-152)
  const ip = getClientIp(request);

  // 2. Redis-backed sliding-window rate limiting (E-COM-017)
  const rateLimit = await checkAdminLoginRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts from this IP address. Access temporarily locked for ${
          rateLimit.retryAfterSeconds ?? 900
        } seconds.`
      },
      { status: 429 }
    );
  }

  try {
    const json = await request.json();
    const parsed = AdminLoginSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? 'Invalid email address or password format.'
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    const db = getSharedDb();
    const result = await authenticateAdminWithPassword(db, {
      email,
      password,
      ipAddress: ip,
      userAgent
    });

    if (!result.success) {
      // Artificial delay to prevent timing brute-force attacks
      await new Promise((resolve) => setTimeout(resolve, 300));

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          isLocked: result.isLocked,
          retryAfterSeconds: result.retryAfterSeconds
        },
        { status: result.isLocked ? 423 : 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        role: result.admin.role
      }
    });

    // Set secure HTTP-only session cookie
    response.cookies.set(ADMIN_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: result.expiresAt,
      path: '/'
    });

    return response;
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 500 });
  }
}
