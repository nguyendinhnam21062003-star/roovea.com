import { z } from "zod"

import { stripHtml } from "@/lib/validation/shared"

const optionalUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (value) => {
      if (!value) return true

      try {
        return ["http:", "https:"].includes(new URL(value).protocol)
      } catch {
        return false
      }
    },
    { message: "URL phải bắt đầu bằng http:// hoặc https://." }
  )

const shortListSchema = z.array(z.string().trim().min(1).max(160)).max(30)

export const rentalProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+?84|0)\d{9}$/, "Số điện thoại chưa đúng định dạng."),
  zalo: z.string().trim().max(30).optional().default(""),
})

export const rentalListingSchema = z.object({
  id: z.string().trim().max(160).optional().default(""),
  code: z.string().trim().max(32).optional().default(""),
  supplierId: z.string().trim().max(160).optional().default(""),
  name: z.string().trim().max(180),
  publicationStatus: z.enum(["draft", "published", "hidden", "archived"]),
  availabilityStatus: z.enum([
    "available",
    "occupied",
    "renovating",
    "paused",
  ]),
  rentalType: z.enum([
    "boarding_room",
    "mini_apartment",
    "room_in_house",
    "shared_room",
    "dormitory",
    "whole_house",
    "apartment",
    "other",
  ]),
  otherRentalType: z.string().trim().max(120).optional().default(""),
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((value) => stripHtml(value)),
  monthlyPrice: z.number().int().min(0).max(1_000_000_000),
  areaM2: z.number().int().min(0).max(10_000),
  maxOccupants: z.number().int().min(1).max(100),
  city: z.string().trim().max(120).default("TP. Hồ Chí Minh"),
  newWard: z.string().trim().max(160),
  legacyWard: z.string().trim().max(160),
  legacyDistrict: z.string().trim().max(160),
  addressDetail: z.string().trim().max(500),
  googleMapsUrl: optionalUrlSchema,
  nearbyPlaces: z.array(z.string().trim().min(1).max(160)).max(3),
  electricityPrice: z.string().trim().max(200),
  waterPrice: z.string().trim().max(200),
  otherCosts: z.string().trim().max(1000).optional().default(""),
  amenities: shortListSchema,
  customAmenities: z.array(z.string().trim().min(1).max(120)).max(20),
  allowedRules: shortListSchema,
  disallowedRules: shortListSchema,
  media: z.object({
    images: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(200),
          url: z.string().trim().min(1).max(1500),
          caption: z.string().trim().max(300),
          isThumbnail: z.boolean(),
        })
      )
      .max(12),
    videoUrls: z.array(optionalUrlSchema).max(5),
  }),
  internalNote: z.string().trim().max(3000).optional().default(""),
  hiddenReason: z.string().trim().max(1000).optional().default(""),
})

export function getRentalPublishingErrors(
  rental: z.infer<typeof rentalListingSchema>,
  options?: { ownerPhone?: string; requireSupplier?: boolean }
) {
  const errors: Record<string, string> = {}

  if (!rental.name) errors.name = "Vui lòng nhập tên phòng."
  if (!rental.description) errors.description = "Vui lòng nhập mô tả."
  if (rental.rentalType === "other" && !rental.otherRentalType) {
    errors.otherRentalType = "Vui lòng nhập loại hình khác."
  }
  if (rental.monthlyPrice <= 0) errors.monthlyPrice = "Giá thuê phải lớn hơn 0."
  if (rental.areaM2 <= 0) errors.areaM2 = "Diện tích phải lớn hơn 0."
  if (!rental.newWard) errors.newWard = "Vui lòng nhập phường/xã mới."
  if (!rental.legacyWard) errors.legacyWard = "Vui lòng nhập phường/xã cũ."
  if (!rental.legacyDistrict) {
    errors.legacyDistrict = "Vui lòng nhập quận/huyện cũ."
  }
  if (!rental.addressDetail) errors.addressDetail = "Vui lòng nhập địa chỉ."
  if (!rental.googleMapsUrl) {
    errors.googleMapsUrl = "Vui lòng nhập link Google Maps."
  }
  if (!rental.electricityPrice) {
    errors.electricityPrice = "Vui lòng nhập giá điện."
  }
  if (!rental.waterPrice) errors.waterPrice = "Vui lòng nhập giá nước."
  if (rental.media.images.length < 3) {
    errors.images = "Cần tối thiểu 3 ảnh để xuất bản."
  }
  if (
    rental.media.images.filter((image) => image.isThumbnail).length !== 1
  ) {
    errors.images = "Vui lòng chọn đúng một ảnh đại diện."
  }
  if (options?.requireSupplier && !rental.supplierId) {
    errors.supplierId = "Vui lòng chọn đối tác/chủ nhà."
  }
  if (options?.ownerPhone !== undefined && !options.ownerPhone) {
    errors.ownerPhone = "Vui lòng hoàn thành số điện thoại trong hồ sơ."
  }

  return errors
}

export const rentalVerificationSchema = z.object({
  isVerified: z.boolean(),
})

export const rentalVisibilitySchema = z.object({
  publicationStatus: z.enum(["published", "hidden", "archived"]),
  hiddenReason: z.string().trim().max(1000).optional().default(""),
})
