import { NextResponse } from 'next/server';

import { orderAttributionSchema } from '@hh/domain';

/** 30-day TTL – matches the client-side attribution window */
const ATTRIBUTION_MAX_AGE = 30 * 24 * 60 * 60; // seconds

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/analytics/attribution
 *
 * Persists UTM / Instagram attribution data as an HTTP-only, SameSite=Lax,
 * first-party cookie so it survives Safari WebKit ITP's 7-day localStorage purge.
 *
 * Body: { attribution: OrderAttribution; storedAt: number }
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const { attribution, storedAt } = body as { attribution: unknown; storedAt: unknown };

    const parsed = orderAttributionSchema.safeParse(attribution);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid attribution schema', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cookieValue = JSON.stringify({
      attribution: parsed.data,
      storedAt: storedAt ?? Date.now()
    });

    const response = NextResponse.json({ success: true });

    response.headers.set(
      'Set-Cookie',
      `hh_attribution_v1=${encodeURIComponent(cookieValue)}; HttpOnly; Path=/; Max-Age=${ATTRIBUTION_MAX_AGE}; SameSite=Lax`
    );

    return response;
  } catch (error) {
    console.error('Attribution cookie set error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set attribution cookie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/attribution
 *
 * Clears the HTTP-only attribution cookie after a successful order placement.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    'hh_attribution_v1=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  );
  return response;
}
