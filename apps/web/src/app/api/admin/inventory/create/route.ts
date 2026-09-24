import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { invalidateCatalogCache } from '@/lib/catalog-cache';
import { getClientIp } from '@/lib/client-ip';

import {
  createProductWithVariants,
  findStoreBySlug,
  getSharedDbClient,
  recordAdminAuditLog
} from '@hh/db';
import { createProductSchema } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
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

    // Record immutable admin audit log (E-COM-073)
    await recordAdminAuditLog(db, {
      adminId: isAuthed.admin.id,
      adminEmail: isAuthed.admin.email,
      action: 'inventory:product_created',
      entityType: 'product',
      entityId: result.product.id,
      details: {
        title: result.product.title,
        slug: result.product.slug,
        variantsCount: result.variants.length
      },
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent') ?? null
    });

    // Invalidate edge & Redis catalog cache upon product creation (E-COM-116)
    await invalidateCatalogCache({ slug: result.product.slug });

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
