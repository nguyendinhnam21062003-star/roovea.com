ALTER TABLE "rooms" ADD COLUMN "child_age_max" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "weekday_supplier_price" numeric(14, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "special_supplier_price" numeric(14, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "weekday_customer_price" numeric(14, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "special_customer_price" numeric(14, 0) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "weekday_price_unit" "price_unit" DEFAULT 'per_night' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "special_price_unit" "price_unit" DEFAULT 'per_night' NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "weekday_unit_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "special_unit_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "weekday_days" jsonb DEFAULT '["monday","tuesday","wednesday","thursday","friday"]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "rooms"
SET
  "weekday_supplier_price" = "supplier_price",
  "weekday_customer_price" = "reference_price",
  "weekday_price_unit" = "price_unit",
  "special_price_unit" = "price_unit";
