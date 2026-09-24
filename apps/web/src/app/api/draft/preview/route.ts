import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeRedirectPath(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return '/';
  }
  return path;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const rawPath = searchParams.get('path');

  const previewSecret = process.env['PREVIEW_SECRET'] ?? 'hh_preview_secret_2026';
  const hasSecret = Boolean(secret && secret === previewSecret);
  const isAuthedAdmin = !hasSecret && Boolean(await getAdminSession());

  if (!hasSecret && !isAuthedAdmin) {
    return new Response('Unauthorized draft preview request.', { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(sanitizeRedirectPath(rawPath));
}
