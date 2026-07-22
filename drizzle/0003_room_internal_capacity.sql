ALTER TABLE "rooms" ADD COLUMN "max_adults" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "max_children" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "rooms" SET "max_adults" = GREATEST("max_guests", 1), "max_children" = 0;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "internal_note" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "internal_policy_url" text;
