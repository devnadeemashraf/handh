import { NextResponse } from 'next/server';

import { createDbClient, deleteFamilyMember, updateFamilyMember } from '@hh/db';
import { UpdateFamilyMemberSchema } from '@hh/domain';

import { requireUser } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: memberId } = await props.params;

    const json = await request.json();
    const parseResult = UpdateFamilyMemberSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid family update details.'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateFamilyMember(db, user.id, memberId, parseResult.data);

    return NextResponse.json({ success: true, member: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update family member.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: memberId } = await props.params;

    const db = getDatabase();
    await deleteFamilyMember(db, user.id, memberId);

    return NextResponse.json({ success: true, message: 'Family member removed.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete family member.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
