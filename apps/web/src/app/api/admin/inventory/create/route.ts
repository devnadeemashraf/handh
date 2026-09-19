import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

import { createDbClient, createProductWithVariants, findStoreBySlug } from '@hh/db';
import { createProductSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const db = getDatabase();

    const store = await findStoreBySlug(db, 'hh');

    if (!store) {
      return NextResponse.json({ success: false, error: 'Store not found.' }, { status: 404 });
    }

    // Auto-generate slug if missing or blank
    const preparedInput = {
      ...json,
      storeId: store.id,
      slug: json.slug?.trim() ? slugify(json.slug) : slugify(json.title || 'untitled-product'),
      department: json.department || 'unisex',
      status: json.status || 'published',
      isCustomizable: Boolean(json.isCustomizable),
      specifications: json.specifications || {},
      tags: Array.isArray(json.tags) ? json.tags : [],
      images: Array.isArray(json.images) ? json.images : [],
      variants: Array.isArray(json.variants) ? json.variants : []
    };

    const parseResult = createProductSchema.safeParse(preparedInput);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed.',
          details: parseResult.error.format()
        },
        { status: 400 }
      );
    }

    const result = await createProductWithVariants(db, parseResult.data);

    return NextResponse.json({
      success: true,
      product: result.product,
      variants: result.variants
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create product.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
