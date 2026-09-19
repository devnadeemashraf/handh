import { NextResponse } from 'next/server';

import { createDbClient, processShippingWebhookEvent } from '@hh/db';

import { getShippingRegistry } from '../../../../../lib/shipping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function POST(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const registry = getShippingRegistry();
  const adapter = registry.get(provider.toLowerCase());

  if (!adapter) {
    return NextResponse.json(
      { success: false, error: `Unsupported shipping provider: '${provider}'` },
      { status: 404 }
    );
  }

  try {
    const rawBody = await request.text();
    const headersRecord: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersRecord[key.toLowerCase()] = value;
    });

    // 1. Verify webhook authenticity using adapter
    const isValid = adapter.verifyWebhookSignature(rawBody, headersRecord);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature or token.' },
        { status: 401 }
      );
    }

    // 2. Parse into normalized domain event
    const normalizedEvent = adapter.parseWebhookPayload(rawBody);

    // 3. Process database state machine transition
    const db = getDatabase();
    const result = await processShippingWebhookEvent(db, normalizedEvent);

    return NextResponse.json({
      success: true,
      processed: result.processed,
      orderCompleted: result.orderCompleted,
      ...(result.reason ? { reason: result.reason } : {})
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process shipping webhook';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
