import { redirect } from 'next/navigation';

import { createDbClient, listUsers } from '@hh/db';

import { getAdminSession } from '../../../lib/admin-auth';
import { getUserSession } from '../../../lib/auth';
import UsersDashboard from './UsersDashboard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminUsersPage() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    redirect('/admin/login');
  }

  const db = getDatabase();
  const [users, session] = await Promise.all([
    listUsers(db, 'hh'),
    getUserSession()
  ]);

  const currentUserRole = session?.user.role ?? 'admin';
  const currentUserId = session?.user.id;

  return (
    <UsersDashboard
      initialUsers={users}
      currentUserRole={currentUserRole}
      currentUserId={currentUserId}
    />
  );
}
