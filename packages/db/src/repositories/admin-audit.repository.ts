import { and, desc, eq } from 'drizzle-orm';

import type { AdminAuditLogEntry } from '@hh/domain';

import {
  type AdminAuditLogRecord,
  adminAuditLogs,
  type NewAdminAuditLogRecord
} from '../schema/admin';

import type { DatabaseClient } from '../index';

export function toDomainAdminAuditLog(record: AdminAuditLogRecord): AdminAuditLogEntry {
  return {
    id: record.id,
    adminId: record.adminId,
    adminEmail: record.adminEmail,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    details: record.details,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    createdAt: record.createdAt.toISOString()
  };
}

export async function recordAdminAuditLog(
  db: DatabaseClient,
  entry: Omit<NewAdminAuditLogRecord, 'id' | 'createdAt'>
): Promise<AdminAuditLogRecord> {
  const [created] = await db
    .insert(adminAuditLogs)
    .values({
      ...entry,
      details: entry.details ?? {}
    })
    .returning();

  if (!created) {
    throw new Error('Failed to record admin audit log entry.');
  }

  return created;
}

export async function listAdminAuditLogs(
  db: DatabaseClient,
  options: {
    adminId?: string | undefined;
    entityType?: string | undefined;
    action?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
  } = {}
): Promise<AdminAuditLogEntry[]> {
  const { adminId, entityType, action, limit = 50, offset = 0 } = options;

  const conditions = [];
  if (adminId) conditions.push(eq(adminAuditLogs.adminId, adminId));
  if (entityType) conditions.push(eq(adminAuditLogs.entityType, entityType));
  if (action) conditions.push(eq(adminAuditLogs.action, action));

  const query = db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  return rows.map(toDomainAdminAuditLog);
}
