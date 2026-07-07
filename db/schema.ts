import {
  boolean,
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

import type {
  AccommodationType,
  CancellationPolicy,
  DistanceToCenter,
  Gender,
  PetsPolicy,
  RoomPolicies,
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
    bedrooms: integer("bedrooms").notNull().default(0),
    bathrooms: integer("bathrooms").notNull().default(0),
    beds: integer("beds").notNull().default(0),
    supplierId: text("supplier_id").references(() => suppliers.id),
    supplierPrice: numeric("supplier_price", {
      precision: 14,
      scale: 0,
    }).notNull(),
    commissionType: commissionTypeEnum("commission_type").notNull(),
    commissionValue: numeric("commission_value", {
      precision: 14,
      scale: 2,
    }).notNull(),
    referencePrice: numeric("reference_price", {
      precision: 14,
      scale: 0,
    }).notNull(),
    strikethroughPrice: numeric("strikethrough_price", {
      precision: 14,
      scale: 0,
    }),
    priceUnit: priceUnitEnum("price_unit").notNull().default("per_night"),
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
