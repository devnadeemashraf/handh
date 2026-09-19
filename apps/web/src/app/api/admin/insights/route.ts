import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

import { createDbClient, getExecutiveInsights } from '@hh/db';

import type { InsightTimeframe } from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

const VALID_TIMEFRAMES: Set<string> = new Set(['today', 'week', 'month', 'all']);

export async function GET(request: Request) {
  const isAuthed = await getAdminSession();
  if (!isAuthed) {
    return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeframeParam = searchParams.get('timeframe') ?? 'week';
    const timeframe: InsightTimeframe = VALID_TIMEFRAMES.has(timeframeParam)
      ? (timeframeParam as InsightTimeframe)
      : 'week';

    const db = getDatabase();
    const insights = await getExecutiveInsights(db, 'hh', timeframe);

    return NextResponse.json({ success: true, insights });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch executive insights.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
