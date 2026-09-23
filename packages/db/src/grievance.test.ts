import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
  createDbClient,
  createGrievanceTicket,
  type DatabaseClient,
  findGrievanceTicketById,
  findGrievanceTicketByReference,
  listGrievanceTickets,
  updateGrievanceTicketStatus
} from './index';
import { outboxEvents } from './schema';

describe('Grievance Redressal Repository', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db: DatabaseClient = createDbClient(databaseUrl);

  const testEmail = `test-grievance-${Date.now()}@example.com`;

  it('creates a grievance ticket with statutory 48h and 30d SLA dates and emits an outbox event', async () => {
    const fixedNow = new Date('2026-09-23T10:00:00.000Z');
    const customRef = `GRV-20260923-TEST${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await createGrievanceTicket(
      db,
      {
        fullName: 'Zainab Ahmed',
        email: testEmail,
        phoneNumber: '+919876543210',
        orderNumber: 'HH-2026-9999',
        category: 'shipping_delay',
        subject: 'Shipment delayed past estimated delivery date',
        description: 'The tracking status shows stuck at Hyderabad facility for 5 business days.'
      },
      {
        ticketReference: customRef,
        now: fixedNow
      }
    );

    expect(ticket.id).toBeDefined();
    expect(ticket.ticketReference).toBe(customRef);
    expect(ticket.fullName).toBe('Zainab Ahmed');
    expect(ticket.email).toBe(testEmail);
    expect(ticket.phoneNumber).toBe('+919876543210');
    expect(ticket.status).toBe('received');
    expect(ticket.acknowledgedAt).toBeNull();
    expect(ticket.resolvedAt).toBeNull();

    // Check SLA dates
    const diffAckHours =
      (new Date(ticket.acknowledgementDueAt).getTime() - fixedNow.getTime()) / (1000 * 60 * 60);
    const diffResDays =
      (new Date(ticket.resolutionDueAt).getTime() - fixedNow.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffAckHours).toBe(48);
    expect(diffResDays).toBe(30);

    // Verify outbox event was generated
    const [event] = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.aggregateId, customRef))
      .limit(1);

    expect(event).toBeDefined();
    expect(event?.eventName).toBe('customer.grievance_submitted');
    expect(event?.aggregateType).toBe('grievance');
    const payload = event?.payload as Record<string, unknown>;
    expect(payload['ticketReference']).toBe(customRef);
    expect(payload['email']).toBe(testEmail);
  });

  it('finds an existing ticket by statutory ticket reference', async () => {
    const customRef = `GRV-20260923-FIND${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await createGrievanceTicket(
      db,
      {
        fullName: 'Sameer Khan',
        email: testEmail,
        phoneNumber: '+919123456789',
        category: 'damaged_defective',
        description: 'The box was crushed during transit and the clasp is damaged.'
      },
      { ticketReference: customRef }
    );

    const found = await findGrievanceTicketByReference(db, customRef);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
    expect(found?.category).toBe('damaged_defective');

    const byId = await findGrievanceTicketById(db, created.id);
    expect(byId).not.toBeNull();
    expect(byId?.ticketReference).toBe(customRef);
  });

  it('updates ticket status through acknowledgement and resolution lifecycles', async () => {
    const customRef = `GRV-20260923-LIFE${Math.floor(1000 + Math.random() * 9000)}`;
    const ticket = await createGrievanceTicket(
      db,
      {
        fullName: 'Bilal Farooqui',
        email: testEmail,
        phoneNumber: '+919988776655',
        category: 'refund_payment',
        description: 'Payment was charged twice for a single order submission.'
      },
      { ticketReference: customRef }
    );

    // 1. Acknowledge within 48 hours
    const ackTime = new Date();
    const acknowledged = await updateGrievanceTicketStatus(db, ticket.id, 'acknowledged', {
      now: ackTime
    });
    expect(acknowledged?.status).toBe('acknowledged');
    expect(acknowledged?.acknowledgedAt).not.toBeNull();

    // 2. Resolve
    const resTime = new Date();
    const resolved = await updateGrievanceTicketStatus(db, ticket.id, 'resolved', {
      now: resTime,
      resolutionNotes: 'Duplicate charge refunded via Razorpay payment ID pay_test_duplicate.'
    });
    expect(resolved?.status).toBe('resolved');
    expect(resolved?.resolvedAt).not.toBeNull();
    expect(resolved?.resolutionNotes).toContain('Razorpay');
  });

  it('lists grievance tickets with optional email filtering', async () => {
    const tickets = await listGrievanceTickets(db, { email: testEmail });
    expect(tickets.length).toBeGreaterThanOrEqual(3);
    for (const t of tickets) {
      expect(t.email).toBe(testEmail);
    }
  });
});
