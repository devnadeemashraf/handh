import { type NextRequest, NextResponse } from 'next/server';

import { createDbClient, hashSessionToken, revokeSessionByTokenHash } from '@hh/db';

import { USER_SESSION_COOKIE } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(USER_SESSION_COOKIE)?.value;
    if (token) {
      const tokenHash = hashSessionToken(token);
      const db = getDatabase();
      await revokeSessionByTokenHash(db, tokenHash);
    }

    const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
    response.cookies.delete(USER_SESSION_COOKIE);
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to log out.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
