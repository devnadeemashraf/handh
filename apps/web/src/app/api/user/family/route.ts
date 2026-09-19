import { NextResponse } from 'next/server';

import { createDbClient, createFamilyMember, listFamilyMembers } from '@hh/db';
import { CreateFamilyMemberSchema } from '@hh/domain';

import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDatabase();
    const family = await listFamilyMembers(db, user.id);

    return NextResponse.json({ success: true, family });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve family members.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = await request.json();
    const parseResult = CreateFamilyMemberSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.errors[0]?.message ?? 'Invalid family member details.'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const member = await createFamilyMember(db, user.id, parseResult.data);

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add family member.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
