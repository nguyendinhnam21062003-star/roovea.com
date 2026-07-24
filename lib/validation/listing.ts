import { z } from "zod"

import { stripHtml } from "@/lib/validation/shared"

const optionalUrl = z
  .string()
  .trim()
  .max(1500)
  .refine((value) => {
    if (!value) return true
    try {
      return ["http:", "https:"].includes(new URL(value).protocol)
    } catch {
      return false
    }
  }, "URL phải bắt đầu bằng http:// hoặc https://.")

const textList = z.array(z.string().trim().min(1).max(160)).max(40)

export const unifiedListingSchema = z
  .object({
    id: z.string().trim().max(180).optional().default(""),
    stayType: z.enum(["long_stay", "short_stay"]),
    title: z.string().trim().min(10).max(180),
    accommodationTypes: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
    otherAccommodationType: z.string().trim().max(120).optional().default(""),
    description: z
      .string()
      .trim()
      .min(30)
      .max(5000)
      .transform(stripHtml),
    address: z.object({
      addressSystem: z.enum(["new", "legacy"]),
      newProvinceCode: z.number().int().positive(),
      newProvinceName: z.string().trim().min(1).max(160),
      newWardCode: z.number().int().positive(),
      newWardName: z.string().trim().min(1).max(160),
      legacyProvinceCode: z.number().int().positive(),
      legacyProvinceName: z.string().trim().min(1).max(160),
      legacyDistrictCode: z.number().int().positive(),
      legacyDistrictName: z.string().trim().min(1).max(160),
      legacyWardCode: z.number().int().positive(),
      legacyWardName: z.string().trim().min(1).max(160),
      addressDetail: z.string().trim().min(3).max(500),
      googleMapsUrl: optionalUrl,
      nearbyPlaces: textList.max(20),
    }),
    longStay: z.object({
      ownerLivesOnSite: z.enum(["yes", "no", ""]),
      monthlyPrice: z.number().int().min(0).max(1_000_000_000),
      areaM2: z.number().int().min(0).max(10_000).optional(),
      maxOccupants: z.number().int().min(1).max(100),
      minimumLeaseMonths: z.number().int().min(0).max(120),
    }),
    shortStay: z.object({
      nightlyPrice: z.number().int().min(0).max(1_000_000_000),
      maxAdults: z.number().int().min(1).max(100),
      maxChildren: z.number().int().min(0).max(100),
      bedrooms: z.number().int().min(0).max(100),
      bathrooms: z.number().int().min(0).max(100),
      checkIn: z.string().trim().max(20),
      checkOut: z.string().trim().max(20),
    }),
    otherCosts: z.string().trim().max(1000).optional().default(""),
    amenities: textList,
    customAmenities: textList,
    policyDescription: z.string().trim().max(2000).optional().default(""),
    allowedRules: textList,
    disallowedRules: textList,
    media: z.object({
      images: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(220),
            url: z.string().trim().min(1).max(1500),
            caption: z.string().trim().max(300),
            isThumbnail: z.boolean(),
          })
        )
        .max(12),
      videoUrls: z.array(optionalUrl).max(5),
    }),
    publicationStatus: z
      .enum(["draft", "published", "hidden", "archived"])
      .optional()
      .default("draft"),
    availabilityStatus: z
      .enum(["available", "occupied", "renovating", "paused"])
      .optional()
      .default("available"),
    supplierId: z.string().trim().max(180).optional().default(""),
    admin: z
      .object({
        supplierPrice: z.number().min(0).max(1_000_000_000),
        commissionType: z.enum(["percentage", "fixed"]),
        commissionValue: z.number().min(0).max(1_000_000_000),
        specialCustomerPrice: z.number().min(0).max(1_000_000_000),
        metaTitle: z.string().trim().max(180),
        metaDescription: z.string().trim().max(500),
      })
      .optional()
      .default({
        supplierPrice: 0,
        commissionType: "percentage",
        commissionValue: 0,
        specialCustomerPrice: 0,
        metaTitle: "",
        metaDescription: "",
      }),
    internalNote: z.string().trim().max(3000).optional().default(""),
    isFeatured: z.boolean().optional().default(false),
    displayPriority: z.number().int().min(0).max(100000).optional().default(0),
  })
  .superRefine((input, context) => {
    const allowedTypes =
      input.stayType === "long_stay"
        ? new Set([
            "apartment",
            "mini_apartment",
            "boarding_room",
            "dormitory",
            "whole_house",
            "room_in_house",
            "other",
          ])
        : new Set([
            "homestay",
            "apartment",
            "hotel",
            "guesthouse",
            "whole_house",
            "villa",
            "cruise",
            "other",
          ])

    if (input.accommodationTypes.some((type) => !allowedTypes.has(type))) {
      context.addIssue({
        code: "custom",
        path: ["accommodationTypes"],
        message: "Loại hình chỗ ở không phù hợp với loại tin.",
      })
    }
    if (
      input.accommodationTypes.includes("other") &&
      !input.otherAccommodationType
    ) {
      context.addIssue({
        code: "custom",
        path: ["otherAccommodationType"],
        message: "Vui lòng nhập loại hình khác.",
      })
    }
    if (
      input.stayType === "long_stay" &&
      (input.longStay.monthlyPrice <= 0 || !input.longStay.ownerLivesOnSite)
    ) {
      context.addIssue({
        code: "custom",
        path: ["longStay"],
        message: "Thông tin cho thuê dài hạn chưa đầy đủ.",
      })
    }
    if (
      input.stayType === "short_stay" &&
      input.shortStay.nightlyPrice <= 0
    ) {
      context.addIssue({
        code: "custom",
        path: ["shortStay", "nightlyPrice"],
        message: "Vui lòng nhập giá mỗi đêm.",
      })
    }
  })

export type UnifiedListingInput = z.infer<typeof unifiedListingSchema>
