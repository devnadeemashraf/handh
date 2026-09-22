ALTER TABLE "orders" ADD COLUMN "idempotency_key" varchar(128);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "unq_orders_store_idempotency" UNIQUE("store_id","idempotency_key");