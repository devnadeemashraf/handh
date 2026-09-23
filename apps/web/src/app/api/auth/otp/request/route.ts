import { NextResponse } from 'next/server';

import { countRecentOTPs, createOTP, generateOTP, getSharedDbClient } from '@hh/db';
import { RequestOTPSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = RequestOTPSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid phone number format.'
        },
        { status: 400 }
      );
    }

    const { phone, purpose } = parseResult.data;
    const db = getDatabase();

    // Rate limiting: max 5 OTP requests per phone in 15 minutes
    const recentCount = await countRecentOTPs(db, phone, 15 * 60 * 1000);
    if (recentCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification attempts. Please wait 15 minutes before requesting again.'
        },
        { status: 429 }
      );
    }

    const code = generateOTP();
    await createOTP(db, phone, code, purpose);

    // In local development or testing, log OTP to console
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH OTP DEV] Mobile: ${phone} | Code: ${code} | Purpose: ${purpose}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your mobile number via WhatsApp/SMS.',
      // In development, include code for convenient developer workflow
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {})
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process verification code.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
