import { redirect } from 'next/navigation';
import { createDbClient, listCoupons } from '@hh/db';
import { getAdminSession } from '@/lib/admin-auth';
import CouponsDashboard from './CouponsDashboard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminCouponsPage() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    redirect('/admin/login');
  }

  const db = getDatabase();
  const coupons = await listCoupons(db, 'hh');

  return <CouponsDashboard initialCoupons={coupons} />;
}
