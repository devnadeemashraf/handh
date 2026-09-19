CREATE TABLE "inventory_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" uuid NOT NULL,
	"previous_on_hand" integer NOT NULL,
	"new_on_hand" integer NOT NULL,
	"delta" integer NOT NULL,
	"reason" varchar(64) NOT NULL,
	"note" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory_audit_logs" ADD CONSTRAINT "inventory_audit_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_audit_variant_created" ON "inventory_audit_logs" USING btree ("variant_id","created_at");