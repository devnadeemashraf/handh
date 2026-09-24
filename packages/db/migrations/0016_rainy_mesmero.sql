CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"anonymous_id" varchar(64),
	"user_id" uuid,
	"event_type" varchar(64) NOT NULL,
	"entity_type" varchar(32),
	"entity_id" varchar(64),
	"properties" jsonb NOT NULL,
	"page_url" varchar(2048),
	"referrer" varchar(2048),
	"user_agent" varchar(1024),
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_events_store_time" ON "analytics_events" USING btree ("store_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_type_time" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_session" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_user" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_created_at" ON "analytics_events" USING btree ("created_at");