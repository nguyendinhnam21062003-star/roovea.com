import { accommodationTypeLabels } from "@/lib/admin/options"
import type {
  AccommodationType,
  PriceUnit,
  RoomPolicies as AdminRoomPolicies,
  Weekday,
} from "@/lib/admin/types"

export type RoomMedia = {
  type: "image" | "video"
  src: string
  alt: string
  thumbnail?: string
}

export type PublicRoom = {
  slug: string
  code: string
  name: string
  referencePrice: number
  priceUnit: PriceUnit
  priceUnitCount: number
  specialPrice: number
  specialPriceUnit: PriceUnit
  specialPriceUnitCount: number
  weekdayDays: Weekday[]
  media: RoomMedia[]
  description: string
  locationLevel1: string
  locationLevel2: string
  address: string
  googleMapUrl: string
  updatedAt: string
  featured?: boolean
  accommodationTypes: AccommodationType[]
  otherAccommodationType?: string
  bedrooms: number
  guests: number
  adultGuests: number
  childGuests: number
  childAgeMax: number
  area: string
  highlights: string[]
  id: string
  policyData: AdminRoomPolicies
}

export type RoomPolicies = {
  checkIn: string
  checkOut: string
}

function getAccommodationTypeFromName(room: Pick<PublicRoom, "name">) {
  if (room.name.includes("Du thuyền")) {
    return "Du thuyền"
  }

  if (room.name.includes("Khách sạn")) {
    return "Khách sạn"
  }

  if (room.name.includes("Nhà nghỉ")) {
    return "Nhà nghỉ"
  }

  if (room.name.includes("Chung cư") || room.name.includes("Penthouse")) {
    return "Chung cư"
  }

  if (room.name.includes("Villa") || room.name.includes("Biệt thự")) {
    return "Biệt thự/Villa"
  }

  if (room.name.includes("Resort")) {
    return "Resort"
  }

  if (room.name.includes("Studio")) {
    return null
  }

  if (room.name.includes("Bungalow")) {
    return null
  }

  if (room.name.includes("Homestay")) {
    return "Homestay"
  }

  if (room.name.includes("Căn hộ")) {
    return "Chung cư"
  }

  if (room.name.includes("Nhà nguyên căn")) {
    return "Nhà nguyên căn"
  }

  return null
}

function getAccommodationTypeOptionLabels(
  type: AccommodationType,
  otherAccommodationType?: string
) {
  if (type === "other" && otherAccommodationType?.trim()) {
    return [otherAccommodationType.trim()]
  }

  if (accommodationTypeLabels[type] === "Khác") {
    return []
  }

  return [accommodationTypeLabels[type]]
}

export function getAccommodationTypeLabels(
  room: Pick<
    PublicRoom,
    "name" | "accommodationTypes" | "otherAccommodationType"
  >
) {
  const labels = room.accommodationTypes.flatMap((type) =>
    getAccommodationTypeOptionLabels(type, room.otherAccommodationType)
  )
  const uniqueLabels = Array.from(new Set(labels.filter(Boolean)))
  const fallbackLabel = getAccommodationTypeFromName(room)

  return uniqueLabels.length
    ? uniqueLabels
    : fallbackLabel
      ? [fallbackLabel]
      : []
}

export function getAccommodationType(
  room: Pick<
    PublicRoom,
    "name" | "accommodationTypes" | "otherAccommodationType"
  >
) {
  return getAccommodationTypeLabels(room).join(" | ")
}

export function getBathroomCount(room: Pick<PublicRoom, "bedrooms">) {
  return Math.max(1, Math.min(4, Math.ceil(room.bedrooms * 0.75)))
}

export function getRoomPriceSuffix(unit: PriceUnit, unitCount = 1) {
  const count = Math.max(1, Math.floor(unitCount))
  const label = unit === "per_hour" ? "giờ" : "đêm"

  return count === 1 ? `/${label}` : `/${count} ${label}`
}

export function getRoomDefaultPriceSuffix(
  room: Pick<PublicRoom, "priceUnit" | "priceUnitCount">
) {
  return getRoomPriceSuffix(room.priceUnit, room.priceUnitCount)
}

export function getRoomSpecialPriceText(
  room: Pick<
    PublicRoom,
    "specialPrice" | "specialPriceUnit" | "specialPriceUnitCount"
  >
) {
  if (room.specialPrice <= 0) {
    return null
  }

  return `${new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(room.specialPrice)}${getRoomPriceSuffix(
    room.specialPriceUnit,
    room.specialPriceUnitCount
  )}`
}

export function getRoomGuestBreakdown(
  room: Pick<
    PublicRoom,
    "adultGuests" | "childGuests" | "childAgeMax" | "guests"
  >
) {
  const adults = room.adultGuests > 0 ? room.adultGuests : room.guests
  const parts = [`${adults} người lớn`]

  if (room.childGuests > 0) {
    parts.push(`${room.childGuests} trẻ em (<= ${room.childAgeMax} tuổi)`)
  }

  return parts.join(" | ")
}

export function getRoomPolicies(room: PublicRoom): RoomPolicies {
  return {
    checkIn: room.policyData.checkInTime,
    checkOut: room.policyData.checkOutTime,
  }
}
