ALTER TABLE "categories" ADD COLUMN "path" varchar(512) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "depth" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "applicable_filter_keys" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "options" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "department" varchar(64) DEFAULT 'unisex' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_customizable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "customization_config" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;