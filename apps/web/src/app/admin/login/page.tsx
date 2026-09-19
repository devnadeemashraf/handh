import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminSession } from '@/lib/admin-auth';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border bg-card shadow-lg p-2 sm:p-4">
        <CardHeader className="text-center pb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-accent font-serif font-bold text-base flex items-center justify-center mx-auto mb-3">
            H&amp;H
          </div>
          <CardTitle className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Workshop Operations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Authorized personnel portal
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AdminLoginForm initialKey={entryKey} />
        </CardContent>
      </Card>
    </div>
  );
}
