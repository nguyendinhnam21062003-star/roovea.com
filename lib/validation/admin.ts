import { z } from "zod"

const nonEmptyString = z.string().trim().min(1)

export const supplierSchema = z.object({
  accommodationTypes: z.array(z.string()).default([]),
  address: z.string().trim().optional().default(""),
  age: z.number().int().min(18).max(100).optional(),
  citizenId: z
    .string()
    .trim()
    .regex(/^(\d{9}|\d{12})$/, "CCCD/CMND cần 9 hoặc 12 chữ số.")
    .optional()
    .or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")).default(""),
  facebookUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
  fullName: nonEmptyString,
  gender: z.string().trim().optional().default("prefer_not_to_say"),
  id: nonEmptyString,
  internalNote: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  serviceAreas: z.array(z.record(z.string(), z.string())).default([]),
  serviceTypes: z.array(z.string()).default([]),
  status: z.enum(["active", "paused", "discontinued"]),
  supplierCode: nonEmptyString,
  tiktokUrl: z.string().trim().url().optional().or(z.literal("")).default(""),
  zalo: z.string().trim().optional().default(""),
})

export const roomSchema = z.object({
  accommodationTypes: z.array(z.string()).min(1).default([]),
  amenities: z.array(z.string()).default([]),
  capacity: z.object({
    bathrooms: z.number().int().min(0).default(0),
    bedrooms: z.number().int().min(0).default(0),
    beds: z.number().int().min(0).default(0),
    maxGuests: z.number().int().min(1).max(99).default(1),
  }),
  createdBy: z.string().trim().optional().default("Admin"),
  customAmenities: z.array(z.string()).default([]),
  description: z.string().trim().max(5000).default(""),
  displayPriority: z.number().int().min(0).default(0),
  id: nonEmptyString,
  isFeatured: z.boolean().default(false),
  location: z.object({
    addressDetail: nonEmptyString,
    distanceToCenter: z.string().trim().default("not_declared"),
    districtCity: z.string().trim().optional().default(""),
    googleMapsUrl: z.string().trim().url().optional().or(z.literal("")),
    nearbyTags: z.array(z.string()).default([]),
    provinceCity: nonEmptyString,
  }),
  media: z.object({
    images: z.array(
      z.object({
        caption: z.string().trim().optional().default(""),
        id: nonEmptyString,
        isThumbnail: z.boolean().default(false),
        url: nonEmptyString,
        warning: z.string().optional(),
      })
    ),
    videoUrls: z.array(z.string().trim().url()).default([]),
  }),
  name: nonEmptyString,
  otherAccommodationType: z.string().trim().optional().default(""),
  policies: z.object({
    cancellationDetail: z.string().trim().optional().default(""),
    cancellationType: z.string().trim().default("conditional"),
    checkInTime: nonEmptyString,
    checkOutTime: nonEmptyString,
    depositDetail: z.string().trim().optional().default(""),
    depositRequired: z.boolean().default(false),
    minimumNights: z.number().int().min(1).default(1),
    otherPolicy: z.string().trim().optional().default(""),
    pets: z.string().trim().default("not_allowed"),
    quietHours: z.string().trim().optional().default(""),
    smoking: z.string().trim().default("not_allowed"),
  }),
  pricing: z.object({
    commissionType: z.enum(["percentage", "fixed"]),
    commissionValue: z.number().min(0),
    priceNote: z.string().trim().optional().default(""),
    priceUnit: z.enum(["per_night", "per_hour"]),
    referencePrice: z.number().min(0),
    strikethroughPrice: z.number().min(0).optional(),
    supplierPrice: z.number().min(0),
  }),
  roomCode: nonEmptyString,
  seo: z
    .object({
      metaDescription: z.string().trim().optional().default(""),
      metaTitle: z.string().trim().optional().default(""),
      shareThumbnailImageId: z.string().trim().optional(),
      slug: z.string().trim().optional().default(""),
    })
    .default({ metaDescription: "", metaTitle: "", slug: "" }),
  status: z.enum([
    "draft",
    "pending_completion",
    "published",
    "hidden",
    "discontinued",
  ]),
  supplierId: z.string().trim().optional(),
  updatedBy: z.string().trim().optional().default("Admin"),
})
