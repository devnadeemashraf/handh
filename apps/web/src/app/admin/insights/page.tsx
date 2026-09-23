import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

import { getExecutiveInsights, getSharedDbClient } from '@hh/db';

import InsightsDashboard from './InsightsDashboard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function AdminInsightsPage() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    redirect('/admin/login');
  }

  const db = getDatabase();
  const insights = await getExecutiveInsights(db, 'hh', 'week');

  return <InsightsDashboard initialInsights={insights} />;
}
