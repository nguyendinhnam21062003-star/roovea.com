import { accommodationTypeLabels } from "@/lib/admin/options"
import type {
  AccommodationType,
  RoomPolicies as AdminRoomPolicies,
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
  strikePrice: number
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

  return uniqueLabels.length ? uniqueLabels : fallbackLabel ? [fallbackLabel] : []
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

export function getRoomDiscount(
  room: Pick<PublicRoom, "referencePrice" | "strikePrice">
) {
  const saving = room.strikePrice - room.referencePrice

  if (saving <= 0) {
    return null
  }

  return {
    percent: Math.round((saving / room.strikePrice) * 100),
    saving,
  }
}

export function getRoomPolicies(room: PublicRoom): RoomPolicies {
  return {
    checkIn: room.policyData.checkInTime,
    checkOut: room.policyData.checkOutTime,
  }
}
