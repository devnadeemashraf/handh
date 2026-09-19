ALTER TABLE "fulfillments" ADD COLUMN "shipping_provider_id" varchar(32) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD COLUMN "label_url" text;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD COLUMN "pickup_token" varchar(128);--> statement-breakpoint
ALTER TABLE "fulfillments" ADD COLUMN "latest_event" text;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fulfillments" ADD COLUMN "raw_webhook_payload" text;--> statement-breakpoint
CREATE INDEX "idx_fulfillments_tracking_number" ON "fulfillments" USING btree ("tracking_number");