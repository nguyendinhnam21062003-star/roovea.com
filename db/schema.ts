import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

import type {
  AccommodationType,
  CancellationPolicy,
  DistanceToCenter,
  Gender,
  PetsPolicy,
  RoomPolicies,
  Weekday,
  ServiceArea,
  ServiceType,
  SmokingPolicy,
} from "../lib/admin/types"
import type { ContactChannelType } from "../lib/contact"

export const roomStatusEnum = pgEnum("room_status", [
  "draft",
  "pending_completion",
  "published",
  "hidden",
  "discontinued",
])

export const supplierStatusEnum = pgEnum("supplier_status", [
  "active",
  "paused",
  "discontinued",
])

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "read",
  "contacted",
  "closed",
  "spam",
])

export const inquirySourceEnum = pgEnum("inquiry_source", [
  "chat_widget_home",
  "chat_widget_room",
  "contact_drawer",
  "other",
])

export const appUserStatusEnum = pgEnum("app_user_status", [
  "active",
  "suspended",
])

export const rentalListingSourceEnum = pgEnum("rental_listing_source", [
  "self_service",
  "admin",
])

export const rentalPublicationStatusEnum = pgEnum(
  "rental_publication_status",
  ["draft", "published", "hidden", "archived"]
)

export const rentalAvailabilityStatusEnum = pgEnum(
  "rental_availability_status",
  ["available", "occupied", "renovating", "paused"]
)

export const rentalTypeEnum = pgEnum("rental_type", [
  "boarding_room",
  "mini_apartment",
  "room_in_house",
  "shared_room",
  "dormitory",
  "whole_house",
  "other",
])

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"])
export const commissionTypeEnum = pgEnum("commission_type", [
  "percentage",
  "fixed",
])
export const priceUnitEnum = pgEnum("price_unit", ["per_night", "per_hour"])

export const contactChannels = pgTable(
  "contact_channels",
  {
    id: text("id").primaryKey(),
    type: varchar("type", { length: 32 }).$type<ContactChannelType>().notNull(),
    label: text("label").notNull(),
    content: text("content").notNull(),
    href: text("href").notNull(),
    external: boolean("external").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    logoSrc: text("logo_src").notNull().default(""),
    logoAlt: text("logo_alt").notNull().default(""),
    appendRoomMessage: boolean("append_room_message").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("contact_channels_enabled_idx").on(table.enabled),
    index("contact_channels_sort_order_idx").on(table.sortOrder),
  ]
)

export const appUsers = pgTable(
  "app_users",
  {
    id: text("id").primaryKey(),
    googleSubject: varchar("google_subject", { length: 255 }).notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    zalo: text("zalo"),
    isVerified: boolean("is_verified").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: text("verified_by"),
    status: appUserStatusEnum("status").notNull().default("active"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_google_subject_unique").on(table.googleSubject),
    uniqueIndex("app_users_email_unique").on(table.email),
    index("app_users_status_idx").on(table.status),
    index("app_users_verified_idx").on(table.isVerified),
  ]
)

export const appUserSessions = pgTable(
  "app_user_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => appUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("app_user_sessions_user_id_idx").on(table.userId),
    index("app_user_sessions_expires_at_idx").on(table.expiresAt),
  ]
)

export const suppliers = pgTable(
  "suppliers",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    fullName: text("full_name").notNull(),
    nationalIdCiphertext: text("national_id_ciphertext"),
    nationalIdLast4: varchar("national_id_last4", { length: 4 }),
    age: integer("age"),
    gender: varchar("gender", { length: 32 }).$type<Gender>(),
    address: text("address"),
    serviceAreas: jsonb("service_areas").$type<ServiceArea[]>().notNull(),
    phone: text("phone"),
    zalo: text("zalo"),
    facebookUrl: text("facebook_url"),
    tiktokUrl: text("tiktok_url"),
    email: text("email"),
    serviceTypes: jsonb("service_types").$type<ServiceType[]>().notNull(),
    accommodationTypes: jsonb("accommodation_types")
      .$type<AccommodationType[]>()
      .notNull(),
    status: supplierStatusEnum("status").notNull().default("active"),
    internalNote: text("internal_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("suppliers_code_unique").on(table.code),
    index("suppliers_status_idx").on(table.status),
  ]
)

export const rooms = pgTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: roomStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    displayPriority: integer("display_priority").notNull().default(0),
    accommodationTypes: jsonb("accommodation_types")
      .$type<AccommodationType[]>()
      .notNull(),
    otherAccommodationType: text("other_accommodation_type"),
    description: text("description").notNull(),
    areaM2: integer("area_m2"),
    maxGuests: integer("max_guests").notNull().default(1),
    maxAdults: integer("max_adults").notNull().default(1),
    maxChildren: integer("max_children").notNull().default(0),
    childAgeMax: integer("child_age_max").notNull().default(6),
    bedrooms: integer("bedrooms").notNull().default(0),
    bathrooms: integer("bathrooms").notNull().default(0),
    beds: integer("beds").notNull().default(0),
    supplierId: text("supplier_id").references(() => suppliers.id),
    supplierPrice: numeric("supplier_price", {
      precision: 14,
      scale: 0,
    }).notNull(),
    weekdaySupplierPrice: numeric("weekday_supplier_price", {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default("0"),
    specialSupplierPrice: numeric("special_supplier_price", {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default("0"),
    commissionType: commissionTypeEnum("commission_type").notNull(),
    commissionValue: numeric("commission_value", {
      precision: 14,
      scale: 2,
    }).notNull(),
    referencePrice: numeric("reference_price", {
      precision: 14,
      scale: 0,
    }).notNull(),
    weekdayCustomerPrice: numeric("weekday_customer_price", {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default("0"),
    specialCustomerPrice: numeric("special_customer_price", {
      precision: 14,
      scale: 0,
    })
      .notNull()
      .default("0"),
    priceUnit: priceUnitEnum("price_unit").notNull().default("per_night"),
    weekdayPriceUnit: priceUnitEnum("weekday_price_unit")
      .notNull()
      .default("per_night"),
    specialPriceUnit: priceUnitEnum("special_price_unit")
      .notNull()
      .default("per_night"),
    weekdayUnitCount: integer("weekday_unit_count").notNull().default(1),
    specialUnitCount: integer("special_unit_count").notNull().default(1),
    weekdayDays: jsonb("weekday_days").$type<Weekday[]>().notNull(),
    priceNote: text("price_note"),
    provinceCity: text("province_city").notNull(),
    districtCity: text("district_city"),
    addressDetail: text("address_detail").notNull(),
    googleMapsUrl: text("google_maps_url"),
    nearbyTags: jsonb("nearby_tags").$type<string[]>().notNull(),
    distanceToCenter: varchar("distance_to_center", { length: 32 })
      .$type<DistanceToCenter>()
      .notNull(),
    policies: jsonb("policies").$type<RoomPolicies>().notNull(),
    smoking: varchar("smoking", { length: 32 })
      .$type<SmokingPolicy>()
      .notNull(),
    pets: varchar("pets", { length: 32 }).$type<PetsPolicy>().notNull(),
    cancellationType: varchar("cancellation_type", {
      length: 32,
    })
      .$type<CancellationPolicy>()
      .notNull(),
    amenities: jsonb("amenities").$type<string[]>().notNull(),
    customAmenities: jsonb("custom_amenities").$type<string[]>().notNull(),
    internalNote: text("internal_note"),
    internalPolicyUrl: text("internal_policy_url"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("rooms_code_unique").on(table.code),
    uniqueIndex("rooms_slug_unique").on(table.slug),
    index("rooms_status_idx").on(table.status),
    index("rooms_supplier_id_idx").on(table.supplierId),
  ]
)

export const rentalListings = pgTable(
  "rental_listings",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 32 })
      .notNull()
      .default(
        sql`('PT' || lpad(nextval('rental_listing_code_seq')::text, 6, '0'))`
      ),
    source: rentalListingSourceEnum("source")
      .notNull()
      .default("self_service"),
    ownerUserId: text("owner_user_id").references(() => appUsers.id),
    supplierId: text("supplier_id").references(() => suppliers.id),
    name: text("name").notNull(),
    publicationStatus: rentalPublicationStatusEnum("publication_status")
      .notNull()
      .default("draft"),
    availabilityStatus: rentalAvailabilityStatusEnum("availability_status")
      .notNull()
      .default("available"),
    rentalType: rentalTypeEnum("rental_type").notNull(),
    otherRentalType: text("other_rental_type"),
    description: text("description").notNull(),
    monthlyPrice: numeric("monthly_price", {
      precision: 14,
      scale: 0,
    }).notNull(),
    areaM2: integer("area_m2").notNull(),
    maxOccupants: integer("max_occupants").notNull().default(1),
    city: text("city").notNull().default("TP. Hồ Chí Minh"),
    newWard: text("new_ward").notNull(),
    legacyWard: text("legacy_ward").notNull(),
    legacyDistrict: text("legacy_district").notNull(),
    addressDetail: text("address_detail").notNull(),
    googleMapsUrl: text("google_maps_url"),
    nearbyPlaces: jsonb("nearby_places").$type<string[]>().notNull(),
    electricityPrice: text("electricity_price").notNull(),
    waterPrice: text("water_price").notNull(),
    otherCosts: text("other_costs"),
    amenities: jsonb("amenities").$type<string[]>().notNull(),
    customAmenities: jsonb("custom_amenities").$type<string[]>().notNull(),
    allowedRules: jsonb("allowed_rules").$type<string[]>().notNull(),
    disallowedRules: jsonb("disallowed_rules").$type<string[]>().notNull(),
    internalNote: text("internal_note"),
    hiddenReason: text("hidden_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("rental_listings_code_unique").on(table.code),
    index("rental_listings_owner_user_id_idx").on(table.ownerUserId),
    index("rental_listings_supplier_id_idx").on(table.supplierId),
    index("rental_listings_publication_status_idx").on(
      table.publicationStatus
    ),
    index("rental_listings_availability_status_idx").on(
      table.availabilityStatus
    ),
    index("rental_listings_legacy_district_idx").on(table.legacyDistrict),
    index("rental_listings_new_ward_idx").on(table.newWard),
    index("rental_listings_public_search_idx").on(
      table.publicationStatus,
      table.availabilityStatus,
      table.legacyDistrict
    ),
    check(
      "rental_listings_owner_source_check",
      sql`((${table.source} = 'self_service' AND ${table.ownerUserId} IS NOT NULL AND ${table.supplierId} IS NULL) OR (${table.source} = 'admin' AND ${table.ownerUserId} IS NULL AND ${table.supplierId} IS NOT NULL))`
    ),
  ]
)

export const rentalListingMedia = pgTable(
  "rental_listing_media",
  {
    id: text("id").primaryKey(),
    rentalListingId: text("rental_listing_id")
      .notNull()
      .references(() => rentalListings.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    url: text("url").notNull(),
    provider: varchar("provider", { length: 32 }).notNull().default("local"),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    isThumbnail: boolean("is_thumbnail").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("rental_listing_media_listing_id_idx").on(table.rentalListingId),
    index("rental_listing_media_thumbnail_idx").on(
      table.rentalListingId,
      table.isThumbnail
    ),
  ]
)

export const roomMedia = pgTable(
  "room_media",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    type: mediaTypeEnum("type").notNull(),
    url: text("url").notNull(),
    provider: varchar("provider", { length: 32 }).notNull().default("local"),
    caption: text("caption"),
    sortOrder: integer("sort_order").notNull().default(0),
    isThumbnail: boolean("is_thumbnail").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("room_media_room_id_idx").on(table.roomId),
    index("room_media_thumbnail_idx").on(table.roomId, table.isThumbnail),
  ]
)

export const customerInquiries = pgTable(
  "customer_inquiries",
  {
    id: text("id").primaryKey(),
    status: inquiryStatusEnum("status").notNull().default("new"),
    source: inquirySourceEnum("source").notNull(),
    roomId: text("room_id").references(() => rooms.id),
    customerName: text("customer_name"),
    phone: text("phone"),
    phoneLast4: varchar("phone_last4", { length: 4 }),
    email: text("email"),
    message: text("message"),
    routePath: text("route_path"),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("customer_inquiries_status_idx").on(table.status),
    index("customer_inquiries_source_idx").on(table.source),
    index("customer_inquiries_room_id_idx").on(table.roomId),
    index("customer_inquiries_created_at_idx").on(table.createdAt),
  ]
)

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorEmail: text("actor_email").notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: text("entity_id").notNull(),
    action: varchar("action", { length: 80 }).notNull(),
    changedFields: jsonb("changed_fields").$type<string[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ]
)
