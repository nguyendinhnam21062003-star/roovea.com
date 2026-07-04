CREATE TYPE "public"."commission_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."inquiry_source" AS ENUM('chat_widget_home', 'chat_widget_room', 'contact_drawer', 'other');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'read', 'contacted', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."price_unit" AS ENUM('per_night', 'per_hour');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('draft', 'pending_completion', 'published', 'hidden', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'paused', 'discontinued');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_email" text NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" text NOT NULL,
	"action" varchar(80) NOT NULL,
	"changed_fields" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"source" "inquiry_source" NOT NULL,
	"room_id" text,
	"customer_name" text,
	"phone" text,
	"phone_last4" varchar(4),
	"email" text,
	"message" text,
	"route_path" text,
	"consent_at" timestamp with time zone,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	"contacted_at" timestamp with time zone,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "room_media" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"provider" varchar(32) DEFAULT 'local' NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_thumbnail" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "room_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_priority" integer DEFAULT 0 NOT NULL,
	"accommodation_types" jsonb NOT NULL,
	"other_accommodation_type" text,
	"space_type" varchar(32),
	"description" text NOT NULL,
	"area_m2" integer,
	"max_guests" integer DEFAULT 1 NOT NULL,
	"bedrooms" integer DEFAULT 0 NOT NULL,
	"bathrooms" integer DEFAULT 0 NOT NULL,
	"beds" integer DEFAULT 0 NOT NULL,
	"bed_types" jsonb NOT NULL,
	"supplier_id" text,
	"supplier_price" numeric(14, 0) NOT NULL,
	"commission_type" "commission_type" NOT NULL,
	"commission_value" numeric(14, 2) NOT NULL,
	"reference_price" numeric(14, 0) NOT NULL,
	"strikethrough_price" numeric(14, 0),
	"price_unit" "price_unit" DEFAULT 'per_night' NOT NULL,
	"price_note" text,
	"province_city" text NOT NULL,
	"district_city" text,
	"address_detail" text NOT NULL,
	"google_maps_url" text,
	"nearby_tags" jsonb NOT NULL,
	"distance_to_center" varchar(32) NOT NULL,
	"policies" jsonb NOT NULL,
	"smoking" varchar(32) NOT NULL,
	"pets" varchar(32) NOT NULL,
	"cancellation_type" varchar(32) NOT NULL,
	"amenities" jsonb NOT NULL,
	"custom_amenities" jsonb NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"full_name" text NOT NULL,
	"national_id_ciphertext" text,
	"national_id_last4" varchar(4),
	"age" integer,
	"gender" varchar(32),
	"address" text,
	"service_areas" jsonb NOT NULL,
	"phone" text,
	"zalo" text,
	"facebook_url" text,
	"tiktok_url" text,
	"email" text,
	"service_types" jsonb NOT NULL,
	"accommodation_types" jsonb NOT NULL,
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"internal_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "customer_inquiries" ADD CONSTRAINT "customer_inquiries_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_media" ADD CONSTRAINT "room_media_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "customer_inquiries_status_idx" ON "customer_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "customer_inquiries_source_idx" ON "customer_inquiries" USING btree ("source");--> statement-breakpoint
CREATE INDEX "customer_inquiries_room_id_idx" ON "customer_inquiries" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "customer_inquiries_created_at_idx" ON "customer_inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "room_media_room_id_idx" ON "room_media" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_media_thumbnail_idx" ON "room_media" USING btree ("room_id","is_thumbnail");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_code_unique" ON "rooms" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "rooms_slug_unique" ON "rooms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "rooms_status_idx" ON "rooms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rooms_supplier_id_idx" ON "rooms" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_unique" ON "suppliers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "suppliers_status_idx" ON "suppliers" USING btree ("status");