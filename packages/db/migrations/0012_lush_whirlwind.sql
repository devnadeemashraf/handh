ALTER TABLE "orders" ADD COLUMN "tax_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cgst_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sgst_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "igst_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "taxable_amount_minor" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_tax_minor" CHECK ("orders"."tax_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_cgst_minor" CHECK ("orders"."cgst_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_sgst_minor" CHECK ("orders"."sgst_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_igst_minor" CHECK ("orders"."igst_minor" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_taxable_amount_minor" CHECK ("orders"."taxable_amount_minor" >= 0);