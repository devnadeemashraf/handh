import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

import { findStoreBySlug, getCategoryTree, getSharedDbClient, listCategoriesByStore } from '@hh/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const store = await findStoreBySlug(db, 'hh');
    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found.' }, { status: 404 });
    }

    const [tree, flat] = await Promise.all([
      getCategoryTree(db, store.id),
      listCategoriesByStore(db, store.id)
    ]);

    return NextResponse.json({
      success: true,
      tree,
      flat: flat.map((c) => ({
        id: c.id,
        parentId: c.parentId,
        slug: c.slug,
        name: c.name,
        path: c.path,
        depth: c.depth,
        applicableFilterKeys: (c.applicableFilterKeys as string[]) ?? []
      }))
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch categories.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
