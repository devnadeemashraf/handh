import { NextResponse } from 'next/server';

import { recordAdminAuditLog, updateUserRole } from '@hh/db';
import { USER_ROLES, type UserRole } from '@hh/domain';

import { getAdminSession, getSharedDb } from '../../../../../../lib/admin-auth';
import { getClientIp } from '../../../../../../lib/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const sessionContext = await getAdminSession();
    if (!sessionContext) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    // Role modification is strictly restricted to super_admin (fail-closed check - E-COM-074)
    if (sessionContext.admin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super administrators can modify user roles.' },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await props.params;

    // Block self-role modification to prevent privilege escalation or accidental lockout
    if (sessionContext.admin.id === targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Self-modification of administrative roles is forbidden.' },
        { status: 400 }
      );
    }

    const json = await request.json();
    const role = json.role as UserRole;

    if (!USER_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: ${String(role)}` },
        { status: 400 }
      );
    }

    const db = getSharedDb();
    const updated = await updateUserRole(db, targetUserId, role);

    // Record 100% auditable record (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: sessionContext.admin.id,
      adminEmail: sessionContext.admin.email,
      action: 'user:role_updated',
      entityType: 'user',
      entityId: targetUserId,
      details: { newRole: role },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update user role.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
