import { NextResponse } from 'next/server';

import { getCurrentUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      success: true,
      user
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve user profile.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
