import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import { grievanceSubmitRateLimiter } from '@/lib/rate-limit';

import { createGrievanceTicket, findGrievanceTicketByReference, getSharedDbClient } from '@hh/db';
import {
  DEFAULT_GRIEVANCE_OFFICER,
  GrievanceSubmissionSchema,
  type GrievanceTicketResult
} from '@hh/domain';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = (await grievanceSubmitRateLimiter.limit(ip)) ?? { success: true, reset: 0 };

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_REQUESTS',
          message:
            'Too many grievance submissions from this network. Please wait before submitting another query.'
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000))
          }
        }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const parsed = GrievanceSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Grievance details are incomplete or invalid',
          details: parsed.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const ticket = await createGrievanceTicket(db, parsed.data);

    const result: GrievanceTicketResult = {
      success: true,
      ticketReference: ticket.ticketReference,
      status: 'received',
      acknowledgementDueAt: ticket.acknowledgementDueAt.toISOString(),
      resolutionDueAt: ticket.resolutionDueAt.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
      message: `Your grievance has been officially registered under Consumer Protection (E-Commerce) Rules, 2020. Our Grievance Officer (${DEFAULT_GRIEVANCE_OFFICER.name}) will acknowledge your ticket within 48 hours.`
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    console.error('Unhandled error in POST /api/grievance:', err);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: `An unexpected error occurred while registering your grievance. Please try again or email ${DEFAULT_GRIEVANCE_OFFICER.email} directly.`
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketReference = searchParams.get('reference')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!ticketReference || !email) {
      return NextResponse.json(
        {
          error: 'MISSING_PARAMETERS',
          message: 'Both reference and email query parameters are required to check ticket status.'
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const ticket = await findGrievanceTicketByReference(db, ticketReference);

    if (!ticket || ticket.email.toLowerCase() !== email) {
      return NextResponse.json(
        {
          error: 'NOT_FOUND',
          message: 'Grievance ticket not found or email verification failed.'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticketReference: ticket.ticketReference,
      status: ticket.status,
      category: ticket.category,
      acknowledgementDueAt: ticket.acknowledgementDueAt.toISOString(),
      resolutionDueAt: ticket.resolutionDueAt.toISOString(),
      acknowledgedAt: ticket.acknowledgedAt?.toISOString() ?? null,
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      createdAt: ticket.createdAt.toISOString()
    });
  } catch (err: unknown) {
    console.error('Unhandled error in GET /api/grievance:', err);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve ticket status.' },
      { status: 500 }
    );
  }
}
