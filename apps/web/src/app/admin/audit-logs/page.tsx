import { redirect } from 'next/navigation';
import { getAdminSession, getSharedDb } from '@/lib/admin-auth';

import { countAdminAuditLogs, listAdminAuditLogs } from '@hh/db';

import AuditLogsDashboard from './AuditLogsDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    redirect('/admin/login');
  }

  const db = getSharedDb();
  const [logs, totalLogs] = await Promise.all([
    listAdminAuditLogs(db, { limit: 100 }),
    countAdminAuditLogs(db)
  ]);

  return <AuditLogsDashboard initialLogs={logs} totalLogs={totalLogs} />;
}
