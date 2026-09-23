import { NextResponse } from 'next/server';

import { getSharedDbClient, processShippingWebhookEvent } from '@hh/db';

import { getShippingRegistry } from '../../../../../lib/shipping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

function getProviderWebhookSecret(provider: string): string | undefined {
  switch (provider.toLowerCase()) {
    case 'shiprocket':
      return process.env['SHIPROCKET_WEBHOOK_SECRET'];
    case 'trackingmore':
      return process.env['TRACKINGMORE_WEBHOOK_SECRET'];
    case 'manual':
      return process.env['MANUAL_WEBHOOK_SECRET'];
    default:
      return undefined;
  }
}

export async function POST(request: Request, props: { params: Promise<{ provider: string }> }) {
  const { provider } = await props.params;
  const normalizedProvider = provider.toLowerCase();
  const registry = getShippingRegistry();
  const adapter = registry.get(normalizedProvider);

  if (!adapter) {
    return NextResponse.json(
      { success: false, error: `Unsupported shipping provider: '${provider}'` },
      { status: 404 }
    );
  }

  // Fail closed in production if secret is unconfigured or placeholder (E-COM-062)
  const isProduction = process.env.NODE_ENV === 'production';
  const secret = getProviderWebhookSecret(normalizedProvider);
  if (isProduction && (!secret || secret.trim() === '' || secret.includes('placeholder'))) {
    console.error(
      `CRITICAL: Webhook secret for carrier '${provider}' is missing or uses placeholder in production!`
    );
    return NextResponse.json(
      { success: false, error: 'Shipping carrier webhook gateway configuration error.' },
      { status: 500 }
    );
  }

  try {
    const rawBody = await request.text();
    const headersRecord: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headersRecord[key.toLowerCase()] = value;
    });

    // 1. Verify webhook authenticity using adapter (fails closed on unset secret, timing-safe)
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
