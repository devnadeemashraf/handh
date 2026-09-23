ALTER TABLE "products" ADD COLUMN "country_of_origin" varchar(64) DEFAULT 'India' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "net_quantity" varchar(32) DEFAULT '1 N' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "commodity_name" varchar(128);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manufacturer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manufacturer_address" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "packer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "packer_address" text;