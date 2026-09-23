import { NextResponse } from 'next/server';

import { executeRetentionPurge, recordAdminAuditLog } from '@hh/db';
import { hasPermission } from '@hh/domain';

import { getAdminSession, getSharedDb } from '../../../../../lib/admin-auth';
import { getClientIp } from '../../../../../lib/client-ip';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Administrative maintenance endpoint for on-demand DPDP Act retention purge (E-COM-166).
 * Purges expired OTP codes (>24h) and anonymizes old outbox event payloads (>30d).
 */
export async function POST(request: Request) {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { admin } = sessionContext;
  const isAuthorized =
    admin.role === 'super_admin' ||
    hasPermission(admin.role, 'service_control:manage') ||
    hasPermission(admin.role, 'compliance:manage');

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: 'Forbidden: insufficient permissions for maintenance retention purge.'
      },
      { status: 403 }
    );
  }

  try {
    let body: { otpRetentionHours?: number; outboxRetentionDays?: number } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const db = getSharedDb();
    const result = await executeRetentionPurge(db, {
      otpRetentionHours: body.otpRetentionHours ?? 24,
      outboxRetentionDays: body.outboxRetentionDays ?? 30
    });

    // Record immutable audit log
    await recordAdminAuditLog(db, {
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'compliance:retention_purged',
      entityType: 'retention_policy',
      entityId: admin.id,
      details: {
        purgedOtpsCount: result.purgedOtpsCount,
        anonymizedOutboxEventsCount: result.anonymizedOutboxEventsCount,
        executedAt: result.executedAt,
        otpRetentionHours: body.otpRetentionHours ?? 24,
        outboxRetentionDays: body.outboxRetentionDays ?? 30
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to execute retention purge.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
