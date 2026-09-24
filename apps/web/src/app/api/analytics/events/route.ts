import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';

import {
  findStoreByHostname,
  findStoreBySlug,
  getSharedDbClient,
  insertAnalyticsEventsBatch
} from '@hh/db';
import { analyticsIngestPayloadSchema } from '@hh/domain';

import type { NewAnalyticsEvent } from '@hh/db';
import type { AnalyticsEventIngestInput } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => null);
    } else {
      const text = await request.text().catch(() => '');
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Empty or invalid JSON payload' },
        { status: 400 }
      );
    }

    const parseResult = analyticsIngestPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    let eventItems: AnalyticsEventIngestInput[];
    if (Array.isArray(data)) {
      eventItems = data;
    } else if ('events' in data && Array.isArray(data.events)) {
      eventItems = data.events;
    } else {
      eventItems = [data as AnalyticsEventIngestInput];
    }

    if (eventItems.length === 0) {
      return NextResponse.json({ success: true, count: 0 }, { status: 200 });
    }

    const db = getDatabase();

    // Resolve store: check if first item specifies storeId, else resolve from host or default 'hh'
    let storeId = eventItems[0]?.storeId;
    if (!storeId) {
      const host = request.headers.get('host') || '';
      const hostname = host.split(':')[0] || '';
      let store = await findStoreByHostname(db, hostname);
      if (!store) {
        store = await findStoreBySlug(db, 'hh');
      }
      if (!store) {
        return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
      }
      storeId = store.id;
    }

    // Hash client IP for DPDP Act 2023 compliance
    const forwarded = request.headers.get('x-forwarded-for');
    const rawIp = forwarded
      ? forwarded.split(',')[0]?.trim() || ''
      : request.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = hashIp(rawIp);
    const headerUserAgent = request.headers.get('user-agent') || undefined;
    const headerReferrer = request.headers.get('referer') || undefined;

    const recordsToInsert: NewAnalyticsEvent[] = eventItems.map((item) => ({
      storeId: item.storeId ?? storeId!,
      sessionId: item.sessionId,
      anonymousId: item.anonymousId,
      userId: item.userId,
      eventType: item.eventType,
      entityType: item.entityType,
      entityId: item.entityId,
      properties: item.properties ?? {},
      pageUrl: item.pageUrl,
      referrer: item.referrer ?? headerReferrer,
      userAgent: item.userAgent ?? headerUserAgent,
      ipHash
    }));

    const inserted = await insertAnalyticsEventsBatch(db, recordsToInsert);

    return NextResponse.json({ success: true, count: inserted.length }, { status: 200 });
  } catch (error) {
    console.error('Analytics event ingestion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ingest analytics events' },
      { status: 500 }
    );
  }
}
