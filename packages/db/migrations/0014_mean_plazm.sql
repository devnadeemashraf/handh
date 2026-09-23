ALTER TABLE "inventory_audit_logs" DROP CONSTRAINT "inventory_audit_logs_variant_id_product_variants_id_fk";
--> statement-breakpoint
ALTER TABLE "inventory_audit_logs" ADD CONSTRAINT "inventory_audit_logs_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE restrict ON UPDATE no action;