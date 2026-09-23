import { NextResponse } from 'next/server';

import { anonymizeUser, getSharedDbClient } from '@hh/db';

import { requireUser, USER_SESSION_COOKIE } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

/**
 * DPDP Act 2023 §12(3) Right to Erasure Endpoint.
 * Atomically redacts customer personal data while retaining statutory tax invoice records
 * for 8-year compliance under CGST Act 2017 §36. Revokes all active sessions.
 */
export async function POST() {
  try {
    const user = await requireUser();
    const db = getDatabase();
    const result = await anonymizeUser(db, user.id);

    const response = NextResponse.json({
      success: true,
      message:
        'Account and personal data successfully anonymized pursuant to DPDP Act, 2023 §12(3). Statutory tax invoice records retained pursuant to CGST Act, 2017 §36.',
      result
    });

    // Clear session cookie upon account anonymization
    response.cookies.delete(USER_SESSION_COOKIE);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to anonymize account';
    const status = message.includes('Authentication')
      ? 401
      : message.includes('already been anonymized')
        ? 409
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
