import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

import { createDbClient, getStoreServiceControl } from '@hh/db';

import ServiceControlDashboard from './ServiceControlDashboard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminServiceControlPage() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    redirect('/admin/login');
  }

  const db = getDatabase();
  const serviceControl = await getStoreServiceControl(db, 'hh');

  return <ServiceControlDashboard initialConfig={serviceControl} />;
}
