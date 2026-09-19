import { NextResponse } from 'next/server';

import { createDbClient, updateUserRole } from '@hh/db';
import { USER_ROLES, type UserRole } from '@hh/domain';

import { getAdminSession } from '../../../../../../lib/admin-auth';
import { getUserSession } from '../../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const isAuthed = await getAdminSession();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role modification is strictly restricted to super_admin
    const userSession = await getUserSession();
    if (userSession && userSession.user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super administrators can modify user roles.' },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await props.params;
    const json = await request.json();
    const role = json.role as UserRole;

    if (!USER_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: ${String(role)}` },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateUserRole(db, targetUserId, role);

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user role.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
