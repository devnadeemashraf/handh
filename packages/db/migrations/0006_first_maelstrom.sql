ALTER TABLE "product_variants" ALTER COLUMN "options" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "specifications" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tags" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "attribution" jsonb;