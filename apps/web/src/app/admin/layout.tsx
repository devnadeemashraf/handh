import { getAdminSession } from '../../lib/admin-auth';
import AdminHeader from './AdminHeader';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAuthed = await getAdminSession();

  // If not logged in, render child directly (e.g. the /admin/login page)
  if (!isAuthed) {
    return <>{children}</>;
  }

  return (
    <div
      className="admin-theme"
      style={{
        minHeight: '100vh',
        backgroundColor: '#081F18',
        color: '#FDFBF7',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <AdminHeader />
      <main className="admin-container" style={{ flex: 1, width: '100%' }}>
        {children}
      </main>
    </div>
  );
}
