import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSecrets, getAdminSession } from '@/lib/admin-auth';

import type { ReactNode } from 'react';

import AdminHeader from './AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAuthed = await getAdminSession();
  const headerList = await headers();
  const pathname = headerList.get('x-admin-pathname') ?? '';

  // 1. If on login page, wrap in background/foreground container
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  // 2. If not authenticated, redirect to login page with access key
  if (!isAuthed) {
    const { accessKey } = getAdminSecrets();
    redirect(`/admin/login?key=${encodeURIComponent(accessKey)}`);
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
