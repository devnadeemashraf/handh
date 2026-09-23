CREATE TABLE "grievance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_reference" varchar(32) NOT NULL,
	"full_name" varchar(128) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"order_number" varchar(64),
	"category" varchar(64) NOT NULL,
	"subject" varchar(255),
	"description" text NOT NULL,
	"status" varchar(32) DEFAULT 'received' NOT NULL,
	"acknowledgement_due_at" timestamp with time zone NOT NULL,
	"resolution_due_at" timestamp with time zone NOT NULL,
	"acknowledged_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grievance_tickets_ticket_reference_unique" UNIQUE("ticket_reference")
);
--> statement-breakpoint
CREATE INDEX "idx_grievance_tickets_ref" ON "grievance_tickets" USING btree ("ticket_reference");--> statement-breakpoint
CREATE INDEX "idx_grievance_tickets_email" ON "grievance_tickets" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_grievance_tickets_status" ON "grievance_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_grievance_tickets_created" ON "grievance_tickets" USING btree ("created_at");