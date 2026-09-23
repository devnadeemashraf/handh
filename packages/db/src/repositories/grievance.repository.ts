import { desc, eq } from 'drizzle-orm';

import {
  calculateGrievanceSlaDates,
  generateGrievanceTicketReference,
  type GrievanceSubmissionInput
} from '@hh/domain';

import {
  type GrievanceTicket,
  grievanceTickets,
  type GrievanceTicketStatus
} from '../schema/grievance';
import { outboxEvents } from '../schema/outbox';

import type { DatabaseClient } from '../index';

export interface CreateGrievanceOptions {
  ticketReference?: string | undefined;
  now?: Date | undefined;
}

export async function createGrievanceTicket(
  db: DatabaseClient,
  input: GrievanceSubmissionInput,
  options: CreateGrievanceOptions = {}
): Promise<GrievanceTicket> {
  const now = options.now ?? new Date();
  const ticketReference = options.ticketReference ?? generateGrievanceTicketReference(now);
  const { acknowledgementDueAt, resolutionDueAt } = calculateGrievanceSlaDates(now);

  const [ticket] = await db
    .insert(grievanceTickets)
    .values({
      ticketReference,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber,
      orderNumber: input.orderNumber ? input.orderNumber : null,
      category: input.category,
      subject: input.subject ? input.subject : null,
      description: input.description,
      status: 'received',
      acknowledgementDueAt,
      resolutionDueAt,
      createdAt: now,
      updatedAt: now
    })
    .returning();

  if (!ticket) {
    throw new Error('Failed to create grievance ticket record');
  }

  // Queue statutory customer acknowledgment email and admin notification via outbox
  await db.insert(outboxEvents).values({
    eventName: 'customer.grievance_submitted',
    aggregateType: 'grievance',
    aggregateId: ticket.ticketReference,
    payload: {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      fullName: ticket.fullName,
      email: ticket.email,
      phoneNumber: ticket.phoneNumber,
      orderNumber: ticket.orderNumber,
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      acknowledgementDueAt: ticket.acknowledgementDueAt.toISOString(),
      resolutionDueAt: ticket.resolutionDueAt.toISOString(),
      createdAt: ticket.createdAt.toISOString()
    },
    status: 'pending',
    scheduledAt: now
  });

  return ticket;
}

export async function findGrievanceTicketByReference(
  db: DatabaseClient,
  ticketReference: string
): Promise<GrievanceTicket | null> {
  const [ticket] = await db
    .select()
    .from(grievanceTickets)
    .where(eq(grievanceTickets.ticketReference, ticketReference))
    .limit(1);

  return ticket ?? null;
}

export async function findGrievanceTicketById(
  db: DatabaseClient,
  id: string
): Promise<GrievanceTicket | null> {
  const [ticket] = await db
    .select()
    .from(grievanceTickets)
    .where(eq(grievanceTickets.id, id))
    .limit(1);

  return ticket ?? null;
}

export async function listGrievanceTickets(
  db: DatabaseClient,
  options: {
    status?: GrievanceTicketStatus | undefined;
    email?: string | undefined;
    limit?: number | undefined;
  } = {}
): Promise<GrievanceTicket[]> {
  const query = db
    .select()
    .from(grievanceTickets)
    .orderBy(desc(grievanceTickets.createdAt))
    .limit(options.limit ?? 50);

  if (options.status) {
    query.where(eq(grievanceTickets.status, options.status));
  } else if (options.email) {
    query.where(eq(grievanceTickets.email, options.email.toLowerCase()));
  }

  return query;
}

export async function updateGrievanceTicketStatus(
  db: DatabaseClient,
  id: string,
  status: GrievanceTicketStatus,
  options: {
    resolutionNotes?: string | undefined;
    now?: Date | undefined;
  } = {}
): Promise<GrievanceTicket | null> {
  const now = options.now ?? new Date();

  const updates: Partial<typeof grievanceTickets.$inferInsert> = {
    status,
    updatedAt: now
  };

  if (status === 'acknowledged') {
    updates.acknowledgedAt = now;
  } else if (status === 'resolved' || status === 'rejected') {
    updates.resolvedAt = now;
    if (options.resolutionNotes) {
      updates.resolutionNotes = options.resolutionNotes;
    }
  }

  const [updated] = await db
    .update(grievanceTickets)
    .set(updates)
    .where(eq(grievanceTickets.id, id))
    .returning();

  return updated ?? null;
}
