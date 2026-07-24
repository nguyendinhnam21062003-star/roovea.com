ALTER TABLE "rooms" RENAME TO "listings";
ALTER TABLE "room_media" RENAME TO "listing_media";
ALTER TABLE "listing_media" RENAME COLUMN "room_id" TO "listing_id";

ALTER INDEX IF EXISTS "rooms_code_unique" RENAME TO "listings_code_unique";
ALTER INDEX IF EXISTS "rooms_slug_unique" RENAME TO "listings_slug_unique";
ALTER INDEX IF EXISTS "rooms_status_idx" RENAME TO "listings_status_idx";
ALTER INDEX IF EXISTS "rooms_supplier_id_idx" RENAME TO "listings_supplier_id_idx";
ALTER INDEX IF EXISTS "room_media_room_id_idx" RENAME TO "listing_media_listing_id_idx";
ALTER INDEX IF EXISTS "room_media_thumbnail_idx" RENAME TO "listing_media_thumbnail_idx";

ALTER TABLE "listings"
  ADD COLUMN "stay_type" varchar(20) DEFAULT 'short_stay' NOT NULL,
  ADD COLUMN "source" "rental_listing_source" DEFAULT 'admin' NOT NULL,
  ADD COLUMN "owner_user_id" text,
  ADD COLUMN "publication_status" "rental_publication_status" DEFAULT 'draft' NOT NULL,
  ADD COLUMN "availability_status" "rental_availability_status" DEFAULT 'available' NOT NULL,
  ADD COLUMN "rental_type" "rental_type" DEFAULT 'other' NOT NULL,
  ADD COLUMN "other_rental_type" text,
  ADD COLUMN "owner_lives_on_site" boolean,
  ADD COLUMN "minimum_lease_months" integer,
  ADD COLUMN "monthly_price" numeric(14, 0) DEFAULT 0 NOT NULL,
  ADD COLUMN "max_occupants" integer DEFAULT 1 NOT NULL,
  ADD COLUMN "city" text DEFAULT '' NOT NULL,
  ADD COLUMN "new_province_code" integer,
  ADD COLUMN "new_province_name" text,
  ADD COLUMN "new_ward_code" integer,
  ADD COLUMN "new_ward_name" text,
  ADD COLUMN "legacy_province_code" integer,
  ADD COLUMN "legacy_province_name" text,
  ADD COLUMN "legacy_district_code" integer,
  ADD COLUMN "legacy_district_name" text,
  ADD COLUMN "legacy_ward_code" integer,
  ADD COLUMN "legacy_ward_name" text,
  ADD COLUMN "new_ward" text DEFAULT '' NOT NULL,
  ADD COLUMN "legacy_ward" text DEFAULT '' NOT NULL,
  ADD COLUMN "legacy_district" text DEFAULT '' NOT NULL,
  ADD COLUMN "nearby_places" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "policy_description" text,
  ADD COLUMN "electricity_price" text DEFAULT '' NOT NULL,
  ADD COLUMN "water_price" text DEFAULT '' NOT NULL,
  ADD COLUMN "other_costs" text,
  ADD COLUMN "allowed_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "disallowed_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN "hidden_reason" text;

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_owner_user_id_app_users_id_fk"
  FOREIGN KEY ("owner_user_id") REFERENCES "public"."app_users"("id")
  ON DELETE no action ON UPDATE no action;

ALTER TABLE "listings"
  ALTER COLUMN "code" SET DEFAULT ('PT' || lpad(nextval('rental_listing_code_seq')::text, 6, '0')),
  ALTER COLUMN "slug" SET DEFAULT ('tin-' || md5(random()::text || clock_timestamp()::text)),
  ALTER COLUMN "source" SET DEFAULT 'self_service';

UPDATE "listings"
SET
  "stay_type" = 'short_stay',
  "source" = 'admin',
  "publication_status" = CASE
    WHEN "status" = 'published' THEN 'published'::"rental_publication_status"
    WHEN "status" = 'hidden' THEN 'hidden'::"rental_publication_status"
    WHEN "status" = 'discontinued' THEN 'archived'::"rental_publication_status"
    ELSE 'draft'::"rental_publication_status"
  END,
  "city" = "province_city",
  "new_province_name" = "province_city",
  "legacy_district_name" = "district_city",
  "legacy_district" = COALESCE("district_city", ''),
  "nearby_places" = "nearby_tags";

INSERT INTO "listings" (
  "id",
  "code",
  "name",
  "slug",
  "stay_type",
  "source",
  "owner_user_id",
  "supplier_id",
  "status",
  "publication_status",
  "availability_status",
  "is_featured",
  "display_priority",
  "accommodation_types",
  "other_accommodation_type",
  "rental_type",
  "other_rental_type",
  "description",
  "area_m2",
  "monthly_price",
  "max_occupants",
  "max_guests",
  "max_adults",
  "max_children",
  "child_age_max",
  "bedrooms",
  "bathrooms",
  "beds",
  "supplier_price",
  "weekday_supplier_price",
  "special_supplier_price",
  "commission_type",
  "commission_value",
  "reference_price",
  "weekday_customer_price",
  "special_customer_price",
  "price_unit",
  "weekday_price_unit",
  "special_price_unit",
  "weekday_unit_count",
  "special_unit_count",
  "weekday_days",
  "price_note",
  "province_city",
  "district_city",
  "city",
  "new_province_name",
  "new_ward_name",
  "legacy_province_name",
  "legacy_district_name",
  "legacy_ward_name",
  "new_ward",
  "legacy_ward",
  "legacy_district",
  "address_detail",
  "google_maps_url",
  "nearby_tags",
  "nearby_places",
  "distance_to_center",
  "policies",
  "smoking",
  "pets",
  "cancellation_type",
  "electricity_price",
  "water_price",
  "other_costs",
  "amenities",
  "custom_amenities",
  "allowed_rules",
  "disallowed_rules",
  "internal_note",
  "hidden_reason",
  "meta_title",
  "meta_description",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at"
)
SELECT
  "id",
  "code",
  "name",
  lower("code"),
  'long_stay',
  "source",
  "owner_user_id",
  "supplier_id",
  CASE
    WHEN "publication_status" = 'published' THEN 'published'::"room_status"
    WHEN "publication_status" = 'hidden' THEN 'hidden'::"room_status"
    WHEN "publication_status" = 'archived' THEN 'discontinued'::"room_status"
    ELSE 'draft'::"room_status"
  END,
  "publication_status",
  "availability_status",
  false,
  0,
  jsonb_build_array("rental_type"::text),
  "other_rental_type",
  "rental_type",
  "other_rental_type",
  "description",
  "area_m2",
  "monthly_price",
  "max_occupants",
  "max_occupants",
  "max_occupants",
  0,
  6,
  0,
  0,
  0,
  0,
  0,
  0,
  'percentage'::"commission_type",
  0,
  0,
  0,
  0,
  'per_night'::"price_unit",
  'per_night'::"price_unit",
  'per_night'::"price_unit",
  1,
  1,
  '[]'::jsonb,
  NULL,
  "city",
  "legacy_district",
  "city",
  "city",
  "new_ward",
  "city",
  "legacy_district",
  "legacy_ward",
  "new_ward",
  "legacy_ward",
  "legacy_district",
  "address_detail",
  "google_maps_url",
  "nearby_places",
  "nearby_places",
  'not_declared',
  jsonb_build_object(
    'checkInTime', '',
    'checkOutTime', '',
    'smoking', 'not_allowed',
    'pets', 'not_allowed',
    'cancellationType', 'conditional',
    'cancellationDetail', '',
    'depositRequired', false,
    'depositDetail', '',
    'minimumNights', 1,
    'quietHours', '',
    'otherPolicy', ''
  ),
  'not_allowed',
  'not_allowed',
  'conditional',
  "electricity_price",
  "water_price",
  "other_costs",
  "amenities",
  "custom_amenities",
  "allowed_rules",
  "disallowed_rules",
  "internal_note",
  "hidden_reason",
  NULL,
  NULL,
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at"
FROM "rental_listings"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "listing_media" (
  "id",
  "listing_id",
  "type",
  "url",
  "provider",
  "caption",
  "sort_order",
  "is_thumbnail",
  "created_at"
)
SELECT
  'legacy-rental-' || "id",
  "rental_listing_id",
  "type",
  "url",
  "provider",
  "caption",
  "sort_order",
  "is_thumbnail",
  "created_at"
FROM "rental_listing_media"
WHERE EXISTS (
  SELECT 1
  FROM "listings"
  WHERE "listings"."id" = "rental_listing_media"."rental_listing_id"
);

CREATE INDEX "listings_stay_type_idx" ON "listings" USING btree ("stay_type");
CREATE INDEX "listings_publication_status_idx" ON "listings" USING btree ("publication_status");
CREATE INDEX "listings_availability_status_idx" ON "listings" USING btree ("availability_status");
CREATE INDEX "listings_owner_user_id_idx" ON "listings" USING btree ("owner_user_id");
