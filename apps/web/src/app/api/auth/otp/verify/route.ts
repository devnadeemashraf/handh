import { NextResponse } from 'next/server';

import {
  createDbClient,
  createSession,
  createUser,
  findUserByPhone,
  findValidOTP,
  generateSessionToken,
  getSessionExpiry,
  hashSessionToken,
  incrementOTPAttempts,
  markOTPVerified,
  updateUserLastLogin,
  updateUserProfile,
  verifyOTP
} from '@hh/db';
import { VerifyOTPSchema } from '@hh/domain';

import { USER_SESSION_COOKIE } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = VerifyOTPSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid OTP verification parameters.'
        },
        { status: 400 }
      );
    }

    const { phone, code, purpose, whatsappOptIn } = parseResult.data;
    const db = getDatabase();

    const otpRecord = await findValidOTP(db, phone, purpose);
    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code is invalid or has expired. Please request a new code.'
        },
        { status: 400 }
      );
    }

    const isMatch = verifyOTP(code, otpRecord.code);
    if (!isMatch) {
      await incrementOTPAttempts(db, otpRecord.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Incorrect verification code. Please check and try again.'
        },
        { status: 400 }
      );
    }

    // Mark OTP as consumed
    await markOTPVerified(db, otpRecord.id);

    // Locate or register user
    let user = await findUserByPhone(db, 'hh', phone);
    if (!user) {
      user = await createUser(db, 'hh', {
        phone,
        phoneVerified: true,
        whatsappOptIn: whatsappOptIn ?? false
      });
    } else {
      await updateUserLastLogin(db, user.id);
      if (whatsappOptIn !== undefined && user.whatsappOptIn !== whatsappOptIn) {
        user = await updateUserProfile(db, user.id, { whatsappOptIn });
      }
    }

    // Create session
    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiry(user.role);

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined;
    const userAgent = request.headers.get('user-agent') ?? undefined;

    await createSession(db, user.id, tokenHash, expiresAt, clientIp, userAgent);

    const response = NextResponse.json({
      success: true,
      user
    });

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: USER_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to verify code.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
