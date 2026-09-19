import { NextResponse } from 'next/server';

import { createDbClient, createPendingCheckoutOrder, findStoreBySlug } from '@hh/db';
import {
  CheckoutSubmissionSchema,
  ConflictError,
  DomainError,
  NotFoundError,
  resolveServiceControl,
  ValidationError
} from '@hh/domain';

import { getCurrentUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parseResult = CheckoutSubmissionSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: 'Please correct the highlighted errors in your checkout details.',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const store = await findStoreBySlug(db, 'hh');

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          code: 'STORE_NOT_FOUND',
          error: 'Active storefront configuration could not be loaded.'
        },
        { status: 404 }
      );
    }

    const serviceControl = resolveServiceControl(
      (store.settings as Record<string, unknown> | undefined)?.['serviceControl']
    );

    if (serviceControl.operatingStatus === 'maintenance' || !serviceControl.checkoutEnabled) {
      return NextResponse.json(
        {
          success: false,
          code: 'SERVICE_UNAVAILABLE',
          error: serviceControl.maintenanceNotice
        },
        { status: 503 }
      );
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          code: 'AUTH_REQUIRED',
          error: 'An account is required to place an order. Please verify your mobile number.'
        },
        { status: 401 }
      );
    }

    const orderResult = await createPendingCheckoutOrder(db, {
      storeId: store.id,
      userId: currentUser.id,
      ...parseResult.data
    });

    return NextResponse.json(
      {
        success: true,
        order: orderResult
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json(
        {
          success: false,
          code: 'INSUFFICIENT_STOCK',
          error: error.userMessage,
          details: error.details
        },
        { status: 409 }
      );
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          code: 'NOT_FOUND',
          error: error.userMessage,
          details: error.details
        },
        { status: 404 }
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          code: 'VALIDATION_ERROR',
          error: error.userMessage,
          details: error.details
        },
        { status: 400 }
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: error.userMessage,
          details: error.details
        },
        { status: 400 }
      );
    }

    console.error('Checkout submission unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        error: 'An unexpected error occurred while placing your order. Please try again.'
      },
      { status: 500 }
    );
  }
}
