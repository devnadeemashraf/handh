import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  findAdminSessionByTokenHash,
  hashAdminSessionToken,
  recordAdminAuditLog,
  revokeAdminSession
} from '@hh/db';

import { ADMIN_COOKIE_NAME, getSharedDb } from '../../../../lib/admin-auth';
import { getClientIp } from '../../../../lib/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

    if (token) {
      const tokenHash = hashAdminSessionToken(token);
      const db = getSharedDb();
      const sessionContext = await findAdminSessionByTokenHash(db, tokenHash);

      if (sessionContext) {
        // 1. Invalidate session in database (E-COM-018)
        await revokeAdminSession(db, tokenHash);

        // 2. Record immutable audit log
        await recordAdminAuditLog(db, {
          adminId: sessionContext.admin.id,
          adminEmail: sessionContext.admin.email,
          action: 'admin:logout',
          entityType: 'admin_session',
          entityId: sessionContext.session.id,
          details: { reason: 'user_initiated_logout' },
          ipAddress: getClientIp(request),
          userAgent: request.headers.get('user-agent') ?? null
        });
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error('Admin logout error:', err);
    const response = NextResponse.json({ success: true });
    response.cookies.delete(ADMIN_COOKIE_NAME);
    return response;
  }
}
