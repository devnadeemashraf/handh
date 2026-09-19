import { NextResponse } from 'next/server';
import { createDbClient, findStoreBySlug, updateStoreInvoiceSettings } from '@hh/db';
import { InvoiceTemplateConfigSchema, resolveInvoiceTemplate } from '@hh/domain';
import { getAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function GET() {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDatabase();
    const store = await findStoreBySlug(db, 'hh');
    const template = resolveInvoiceTemplate(
      (store?.settings as Record<string, unknown> | undefined)?.['invoice']
    );

    return NextResponse.json({ success: true, template });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch invoice settings.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parseResult = InvoiceTemplateConfigSchema.partial().safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const updated = await updateStoreInvoiceSettings(db, 'hh', parseResult.data);

    return NextResponse.json({
      success: true,
      message: 'Invoice template updated successfully.',
      template: updated
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update invoice template.';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
