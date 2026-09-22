import { redirect } from 'next/navigation';

import { listUsers } from '@hh/db';

import { getAdminSession, getSharedDb } from '../../../lib/admin-auth';
import UsersDashboard from './UsersDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const sessionContext = await getAdminSession();
  if (!sessionContext) {
    redirect('/admin/login');
  }

  const db = getSharedDb();
  const users = await listUsers(db, 'hh');

  const currentUserRole = sessionContext.admin.role;
  const currentUserId = sessionContext.admin.id;

  return (
    <UsersDashboard
      initialUsers={users}
      currentUserRole={currentUserRole}
      currentUserId={currentUserId}
    />
  );
}
