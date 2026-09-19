import { getAdminSession } from '@/lib/admin-auth';

import type { ReactNode } from 'react';

import AdminHeader from './AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthed = await getAdminSession();

  // If not logged in, render child directly (e.g. the /admin/login page)
  if (!isAuthed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
