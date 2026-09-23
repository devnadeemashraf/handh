import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import type { GrievanceCategory } from '@hh/domain';

export type GrievanceTicketStatus =
  'received' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';

export const grievanceTickets = pgTable(
  'grievance_tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketReference: varchar('ticket_reference', { length: 32 }).notNull().unique(),
    fullName: varchar('full_name', { length: 128 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull(),
    orderNumber: varchar('order_number', { length: 64 }),
    category: varchar('category', { length: 64 }).$type<GrievanceCategory>().notNull(),
    subject: varchar('subject', { length: 255 }),
    description: text('description').notNull(),
    status: varchar('status', { length: 32 })
      .$type<GrievanceTicketStatus>()
      .notNull()
      .default('received'),
    acknowledgementDueAt: timestamp('acknowledgement_due_at', { withTimezone: true }).notNull(),
    resolutionDueAt: timestamp('resolution_due_at', { withTimezone: true }).notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index('idx_grievance_tickets_ref').on(table.ticketReference),
    index('idx_grievance_tickets_email').on(table.email),
    index('idx_grievance_tickets_status').on(table.status),
    index('idx_grievance_tickets_created').on(table.createdAt)
  ]
);

export type GrievanceTicket = typeof grievanceTickets.$inferSelect;
export type NewGrievanceTicket = typeof grievanceTickets.$inferInsert;
