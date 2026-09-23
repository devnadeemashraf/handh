import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

import { getSharedDbClient, getStorefrontConfig } from '@hh/db';

import BrandCustomizerDashboard from './BrandCustomizerDashboard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function AdminBrandPage() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    redirect('/admin/login');
  }

  const db = getDatabase();
  const config = await getStorefrontConfig(db, 'hh');

  return <BrandCustomizerDashboard initialConfig={config} />;
}
