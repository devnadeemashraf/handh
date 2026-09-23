import { NextResponse } from 'next/server';

import { validateIndianPostalCode } from '@hh/domain';

import { getShippingRegistry } from '../../../../lib/shipping';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/shipping/serviceability?pincode=500034&cod=false
 *
 * Pre-purchase courier serviceability verification (E-COM-063).
 * Evaluates whether delivery is available for a 6-digit Indian PIN code.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pincodeParam = url.searchParams.get('pincode') ?? url.searchParams.get('postalCode');

    if (!pincodeParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'PIN code query parameter is required (e.g. ?pincode=500034)'
        },
        { status: 400 }
      );
    }

    const validation = validateIndianPostalCode(pincodeParam);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error ?? 'Invalid 6-digit Indian PIN code.'
        },
        { status: 400 }
      );
    }

    const codParam = url.searchParams.get('cod');
    const isCod = codParam === 'true' || codParam === '1';

    const registry = getShippingRegistry();
    const serviceability = await registry.checkServiceability({
      postalCode: validation.normalized,
      cod: isCod
    });

    return NextResponse.json({
      success: true,
      serviceability
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to verify postal code serviceability';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
