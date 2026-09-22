import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

import type { ReactNode } from 'react';

import AdminHeader from './AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  const headerList = await headers();
  const pathname = headerList.get('x-admin-pathname') ?? '';

  // 1. If on login page, wrap in clean auth background container
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  // 2. If not authenticated with a valid admin session, redirect cleanly to login
  if (!session) {
    redirect('/admin/login');
  }

  // 3. Fully authenticated admin portal layout
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminHeader />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
