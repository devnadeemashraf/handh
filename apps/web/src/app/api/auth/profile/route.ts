import { NextResponse } from 'next/server';

import { getSharedDbClient, updateUserProfile } from '@hh/db';
import { UpdateProfileSchema } from '@hh/domain';

import { getCurrentUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to update profile.' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const parseResult = UpdateProfileSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid profile update parameters.'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateUserProfile(db, currentUser.id, parseResult.data);

    return NextResponse.json({
      success: true,
      user: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
