import { NextResponse } from 'next/server';

import { findStoreBySlug, getSharedDbClient, validateCartItems } from '@hh/db';
import { CartValidationInputSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = CartValidationInputSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid cart payload',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const store = await findStoreBySlug(db, 'hh');

    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const cartSummary = await validateCartItems(db, store.id, parseResult.data.items);

    return NextResponse.json({
      success: true,
      cart: cartSummary
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while validating cart' },
      { status: 500 }
    );
  }
}
