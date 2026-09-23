import { NextResponse } from 'next/server';

import { getSharedDbClient, removeFromWishlist } from '@hh/db';

import { requireUser } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function DELETE(_request: Request, props: { params: Promise<{ productId: string }> }) {
  try {
    const user = await requireUser();
    const { productId } = await props.params;

    const db = getDatabase();
    await removeFromWishlist(db, user.id, productId);

    return NextResponse.json({ success: true, message: 'Item removed from wishlist.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to remove from wishlist.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
