import type { RoomPolicies as AdminRoomPolicies } from "@/lib/admin/types"

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
  bedrooms: number
  guests: number
  area: string
  highlights: string[]
  amenities: string[]
  id: string
  policyData: AdminRoomPolicies
}

export type RoomPolicies = {
  cancellable: boolean
  checkIn: string
  checkOut: string
  notes: string[]
  petsAllowed: boolean
  smokingAllowed: boolean
}

export function getAccommodationType(room: Pick<PublicRoom, "name">) {
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

  if (room.name.includes("Villa") || room.name.includes("Nhà nguyên căn")) {
    return "Nhà nguyên căn"
  }

  if (room.name.includes("Studio")) {
    return "Căn hộ"
  }

  if (room.name.includes("Bungalow")) {
    return "Bungalow"
  }

  if (room.name.includes("Homestay")) {
    return "Homestay"
  }

  if (room.name.includes("Căn hộ")) {
    return "Căn hộ"
  }

  return "Chỗ nghỉ"
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
  const notes = [
    room.policyData.cancellationDetail,
    room.policyData.depositRequired ? room.policyData.depositDetail : "",
    room.policyData.quietHours,
    room.policyData.otherPolicy,
    `Roovea xác nhận lại điều kiện cuối theo mã phòng #${room.code}.`,
  ].filter(Boolean)

  return {
    cancellable: room.policyData.cancellationType !== "not_allowed",
    checkIn: room.policyData.checkInTime,
    checkOut: room.policyData.checkOutTime,
    notes,
    petsAllowed: room.policyData.pets !== "not_allowed",
    smokingAllowed: room.policyData.smoking !== "not_allowed",
  }
}
