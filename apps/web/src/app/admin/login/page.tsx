import { redirect } from 'next/navigation';

import { getAdminSession } from '../../../lib/admin-auth';
import AdminLoginForm from './AdminLoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage(props: { searchParams: Promise<{ key?: string }> }) {
  const isAuthed = await getAdminSession();
  if (isAuthed) {
    redirect('/admin/orders');
  }

  const searchParams = await props.searchParams;
  const entryKey = searchParams.key ?? '';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#081F18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="admin-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '36px 28px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#164335',
              color: '#C5A880',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              border: '1px solid #235847',
              fontSize: '1rem',
              fontFamily: 'serif',
              letterSpacing: '0.05em'
            }}
          >
            H&amp;H
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontFamily: 'serif',
              color: '#FDFBF7',
              margin: '0 0 6px'
            }}
          >
            Workshop Operations
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', margin: 0 }}>
            Authorized personnel portal
          </p>
        </div>

        <AdminLoginForm initialKey={entryKey} />
      </div>
    </div>
  );
}
