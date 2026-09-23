import { NextResponse } from 'next/server';

import { addToWishlist, getSharedDbClient, listWishlistItemsWithDetails } from '@hh/db';

import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDatabase();
    const items = await listWishlistItemsWithDetails(db, user.id);

    return NextResponse.json({ success: true, wishlist: items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve wishlist.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const json = await request.json();

    if (!json.productId || typeof json.productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid productId is required.' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const item = await addToWishlist(
      db,
      user.id,
      json.productId,
      typeof json.variantId === 'string' ? json.variantId : undefined
    );

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add item to wishlist.';
    const status = message.includes('Authentication') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
