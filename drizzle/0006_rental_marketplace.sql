CREATE TYPE "public"."app_user_status" AS ENUM('active', 'suspended');
CREATE TYPE "public"."rental_listing_source" AS ENUM('self_service', 'admin');
CREATE TYPE "public"."rental_publication_status" AS ENUM('draft', 'published', 'hidden', 'archived');
CREATE TYPE "public"."rental_availability_status" AS ENUM('available', 'occupied', 'renovating', 'paused');
CREATE TYPE "public"."rental_type" AS ENUM('boarding_room', 'mini_apartment', 'room_in_house', 'shared_room', 'dormitory', 'whole_house', 'other');
CREATE SEQUENCE "public"."rental_listing_code_seq" START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE "app_users" (
	"id" text PRIMARY KEY NOT NULL,
	"google_subject" varchar(255) NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"phone" text,
	"zalo" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"status" "app_user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "app_user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "rental_listings" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(32) DEFAULT ('PT' || lpad(nextval('rental_listing_code_seq')::text, 6, '0')) NOT NULL,
	"source" "rental_listing_source" DEFAULT 'self_service' NOT NULL,
	"owner_user_id" text,
	"supplier_id" text,
	"name" text NOT NULL,
	"publication_status" "rental_publication_status" DEFAULT 'draft' NOT NULL,
	"availability_status" "rental_availability_status" DEFAULT 'available' NOT NULL,
	"rental_type" "rental_type" NOT NULL,
	"other_rental_type" text,
	"description" text NOT NULL,
	"monthly_price" numeric(14, 0) NOT NULL,
	"area_m2" integer NOT NULL,
	"max_occupants" integer DEFAULT 1 NOT NULL,
	"city" text DEFAULT 'TP. Hồ Chí Minh' NOT NULL,
	"new_ward" text NOT NULL,
	"legacy_ward" text NOT NULL,
	"legacy_district" text NOT NULL,
	"address_detail" text NOT NULL,
	"google_maps_url" text,
	"nearby_places" jsonb NOT NULL,
	"electricity_price" text NOT NULL,
	"water_price" text NOT NULL,
	"other_costs" text,
	"amenities" jsonb NOT NULL,
	"custom_amenities" jsonb NOT NULL,
	"allowed_rules" jsonb NOT NULL,
	"disallowed_rules" jsonb NOT NULL,
	"internal_note" text,
	"hidden_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	"deleted_at" timestamp with time zone
);

ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_owner_source_check" CHECK ((("source" = 'self_service' AND "owner_user_id" IS NOT NULL AND "supplier_id" IS NULL) OR ("source" = 'admin' AND "owner_user_id" IS NULL AND "supplier_id" IS NOT NULL)));

CREATE TABLE "rental_listing_media" (
	"id" text PRIMARY KEY NOT NULL,
	"rental_listing_id" text NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"provider" varchar(32) DEFAULT 'local' NOT NULL,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_thumbnail" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "app_user_sessions" ADD CONSTRAINT "app_user_sessions_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_owner_user_id_app_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "rental_listing_media" ADD CONSTRAINT "rental_listing_media_rental_listing_id_rental_listings_id_fk" FOREIGN KEY ("rental_listing_id") REFERENCES "public"."rental_listings"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "app_users_google_subject_unique" ON "app_users" USING btree ("google_subject");
CREATE UNIQUE INDEX "app_users_email_unique" ON "app_users" USING btree ("email");
CREATE INDEX "app_users_status_idx" ON "app_users" USING btree ("status");
CREATE INDEX "app_users_verified_idx" ON "app_users" USING btree ("is_verified");
CREATE INDEX "app_user_sessions_user_id_idx" ON "app_user_sessions" USING btree ("user_id");
CREATE INDEX "app_user_sessions_expires_at_idx" ON "app_user_sessions" USING btree ("expires_at");
CREATE UNIQUE INDEX "rental_listings_code_unique" ON "rental_listings" USING btree ("code");
CREATE INDEX "rental_listings_owner_user_id_idx" ON "rental_listings" USING btree ("owner_user_id");
CREATE INDEX "rental_listings_supplier_id_idx" ON "rental_listings" USING btree ("supplier_id");
CREATE INDEX "rental_listings_publication_status_idx" ON "rental_listings" USING btree ("publication_status");
CREATE INDEX "rental_listings_availability_status_idx" ON "rental_listings" USING btree ("availability_status");
CREATE INDEX "rental_listings_legacy_district_idx" ON "rental_listings" USING btree ("legacy_district");
CREATE INDEX "rental_listings_new_ward_idx" ON "rental_listings" USING btree ("new_ward");
CREATE INDEX "rental_listings_public_search_idx" ON "rental_listings" USING btree ("publication_status", "availability_status", "legacy_district");
CREATE INDEX "rental_listing_media_listing_id_idx" ON "rental_listing_media" USING btree ("rental_listing_id");
CREATE INDEX "rental_listing_media_thumbnail_idx" ON "rental_listing_media" USING btree ("rental_listing_id", "is_thumbnail");
