import type {
  CommissionType,
  PriceUnit,
  Room,
  RoomCapacity,
  RoomCompletion,
  RoomImage,
  RoomPricing,
  RoomStatus,
  Supplier,
  Weekday,
} from "@/lib/admin/types"
import { defaultWeekdayDays, weekdayLabels } from "@/lib/admin/options"

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function formatSequenceCode(prefix: string, value: number) {
  return `${prefix}-${String(value).padStart(6, "0")}`
}

export function getNextRoomSequence(rooms: Room[]) {
  return (
    rooms.reduce((max, room) => {
      const match = room.roomCode.match(/^PH-(\d+)$/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0) + 1
  )
}

export function getNextSupplierSequence(suppliers: Supplier[]) {
  return (
    suppliers.reduce((max, supplier) => {
      const match = supplier.supplierCode.match(/^NCC-(\d+)$/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0) + 1
  )
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function buildAutomaticRoomSeo(room: Room) {
  const location = [room.location.districtCity, room.location.provinceCity]
    .filter(Boolean)
    .join(", ")
  const slugBase = slugify(room.name) || slugify(room.roomCode) || "phong"
  const slugCode =
    slugify(room.roomCode.replace(/^PH-/, "")) || slugify(room.roomCode)
  const descriptionParts = [
    room.description,
    location,
    room.capacity.maxGuests > 0 ? `${room.capacity.maxGuests} khách` : "",
  ].filter(Boolean)
  const metaDescription = descriptionParts.join(" - ").slice(0, 155)

  return {
    slug: slugCode ? `${slugBase}-${slugCode}` : slugBase,
    metaTitle: room.name || room.roomCode,
    metaDescription,
    shareThumbnailImageId: getRoomThumbnail(room)?.id,
  }
}

export function withAutomaticRoomSeo(room: Room): Room {
  return {
    ...room,
    seo: buildAutomaticRoomSeo(room),
  }
}

export function calculateCommissionAmount(
  supplierPrice: number,
  commissionType: CommissionType,
  commissionValue: number
) {
  if (commissionType === "percentage") {
    return (supplierPrice * commissionValue) / 100
  }

  return commissionValue
}

function normalizeMoney(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value)

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback
}

function normalizePriceUnit(value: unknown, fallback: PriceUnit): PriceUnit {
  return value === "per_hour" || value === "per_night" ? value : fallback
}

function normalizeUnitCount(value: unknown, fallback = 1) {
  return Math.max(1, normalizeInteger(value, fallback))
}

function normalizeWeekdayDays(value: unknown): Weekday[] {
  if (!Array.isArray(value)) {
    return [...defaultWeekdayDays]
  }

  const days = value.filter((item): item is Weekday =>
    Object.hasOwn(weekdayLabels, String(item))
  )

  return days.length ? days : [...defaultWeekdayDays]
}

export function normalizeRoomPricing(
  pricing: Partial<RoomPricing>
): RoomPricing & {
  weekdaySupplierPrice: number
  specialSupplierPrice: number
  weekdayCustomerPrice: number
  specialCustomerPrice: number
  weekdayPriceUnit: PriceUnit
  specialPriceUnit: PriceUnit
  weekdayUnitCount: number
  specialUnitCount: number
  weekdayDays: Weekday[]
} {
  const legacySupplierPrice = normalizeMoney(pricing.supplierPrice)
  const legacyCustomerPrice = normalizeMoney(pricing.referencePrice)
  const weekdaySupplierCandidate = normalizeMoney(pricing.weekdaySupplierPrice)
  const weekdayCustomerCandidate = normalizeMoney(pricing.weekdayCustomerPrice)
  const weekdaySupplierPrice =
    weekdaySupplierCandidate > 0
      ? weekdaySupplierCandidate
      : legacySupplierPrice
  const weekdayCustomerPrice =
    weekdayCustomerCandidate > 0
      ? weekdayCustomerCandidate
      : legacyCustomerPrice
  const weekdayPriceUnit = normalizePriceUnit(
    pricing.weekdayPriceUnit,
    normalizePriceUnit(pricing.priceUnit, "per_night")
  )
  const specialPriceUnit = normalizePriceUnit(
    pricing.specialPriceUnit,
    weekdayPriceUnit
  )

  return {
    supplierPrice: weekdaySupplierPrice,
    commissionType: pricing.commissionType === "fixed" ? "fixed" : "percentage",
    commissionValue: Math.max(0, Number(pricing.commissionValue ?? 0)),
    referencePrice: weekdayCustomerPrice,
    priceUnit: weekdayPriceUnit,
    weekdaySupplierPrice,
    specialSupplierPrice: normalizeMoney(pricing.specialSupplierPrice),
    weekdayCustomerPrice,
    specialCustomerPrice: normalizeMoney(pricing.specialCustomerPrice),
    weekdayPriceUnit,
    specialPriceUnit,
    weekdayUnitCount: normalizeUnitCount(pricing.weekdayUnitCount),
    specialUnitCount: normalizeUnitCount(pricing.specialUnitCount),
    weekdayDays: normalizeWeekdayDays(pricing.weekdayDays),
    priceNote: pricing.priceNote ?? "",
  }
}

export function calculateExpectedProfit(pricing: RoomPricing) {
  const normalized = normalizeRoomPricing(pricing)

  return normalized.weekdayCustomerPrice - normalized.weekdaySupplierPrice
}

export function calculateSpecialExpectedProfit(pricing: RoomPricing) {
  const normalized = normalizeRoomPricing(pricing)

  return normalized.specialCustomerPrice - normalized.specialSupplierPrice
}

export function getPriceUnitSuffix(unit: PriceUnit, unitCount = 1) {
  const count = Math.max(1, Math.floor(unitCount))
  const label = unit === "per_hour" ? "giờ" : "đêm"

  return count === 1 ? `/${label}` : `/${count} ${label}`
}

export function getWeekdaySummary(days: Weekday[]) {
  return days.map((day) => weekdayLabels[day]).join(", ")
}

export function getRoomThumbnail(room: Room): RoomImage | undefined {
  return (
    room.media.images.find((image) => image.isThumbnail) ?? room.media.images[0]
  )
}

export function hasUnsafeHtml(value: string) {
  return /<\s*(script|iframe|object|embed|link|style)|<\/?[a-z][\s\S]*>/i.test(
    value
  )
}

export function isValidUrl(value: string) {
  if (!value) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function isWhitelistedVideoUrl(value: string) {
  if (!value || hasUnsafeHtml(value)) {
    return false
  }

  try {
    const host = new URL(value).hostname.replace(/^www\./, "")
    return [
      "youtube.com",
      "youtu.be",
      "tiktok.com",
      "vimeo.com",
      "drive.google.com",
    ].some(
      (allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`)
    )
  } catch {
    return false
  }
}

export function isValidVietnamPhone(value: string) {
  return /^(0|\+84)[0-9]{8,10}$/.test(value.replace(/\s/g, ""))
}

export function isValidCitizenId(value: string) {
  return /^(\d{9}|\d{12})$/.test(value)
}

export function maskCitizenId(value: string) {
  if (value.length <= 6) {
    return "••••••"
  }

  return `${value.slice(0, 4)}${"•".repeat(Math.max(2, value.length - 6))}${value.slice(-2)}`
}

export function getRoomCompletion(room: Room): RoomCompletion {
  const capacity = normalizeRoomCapacity(room.capacity)
  const pricing = normalizeRoomPricing(room.pricing)
  const sections = {
    basic:
      Boolean(room.name.trim()) &&
      Boolean(room.roomCode.trim()) &&
      room.accommodationTypes.length > 0 &&
      capacity.maxGuests > 0,
    supplier: Boolean(room.supplierId),
    pricing: pricing.weekdayCustomerPrice > 0,
    location:
      Boolean(room.location.provinceCity) &&
      Boolean(room.location.addressDetail.trim()),
    media: room.media.images.length > 0,
    policies:
      Boolean(room.policies.checkInTime) &&
      Boolean(room.policies.checkOutTime) &&
      room.policies.minimumNights >= 1,
  }

  const missing: string[] = []

  if (!sections.basic) {
    missing.push("Thông tin cơ bản")
  }

  if (!sections.supplier) {
    missing.push("Nhà cung cấp")
  }

  if (!sections.pricing) {
    missing.push("Giá bán ngày thường")
  }

  if (!sections.location) {
    missing.push("Vị trí")
  }

  if (!sections.media) {
    missing.push("Ít nhất một ảnh")
  }

  if (!sections.policies) {
    missing.push("Chính sách nhận/trả phòng")
  }

  const completeSections = Object.values(sections).filter(Boolean).length

  return {
    percent: Math.round(
      (completeSections / Object.keys(sections).length) * 100
    ),
    sections,
    missing,
  }
}

export function resolveRoomStatus(room: Room, requestedStatus: RoomStatus) {
  if (requestedStatus === "draft" || requestedStatus === "hidden") {
    return requestedStatus
  }

  if (
    requestedStatus === "published" &&
    getRoomCompletion(room).missing.length
  ) {
    return "pending_completion"
  }

  if (
    requestedStatus !== "discontinued" &&
    getRoomCompletion(room).missing.length
  ) {
    return "pending_completion"
  }

  return requestedStatus
}

export function copyRoomForDuplicate(room: Room, nextRoomCode: string): Room {
  const now = todayIso()

  return {
    ...room,
    id: makeId("room"),
    roomCode: nextRoomCode,
    name: `${room.name} - Bản sao`,
    status: "draft",
    seo: {
      ...room.seo,
      slug: `${room.seo.slug || slugify(room.name)}-ban-sao`,
    },
    media: {
      ...room.media,
      images: room.media.images.map((image, index) => ({
        ...image,
        id: makeId(`room-image-${index}`),
      })),
      videoUrls: [...room.media.videoUrls],
    },
    createdAt: now,
    updatedAt: now,
    createdBy: "Admin Demo",
    updatedBy: "Admin Demo",
  }
}

export function normalizeNumber(value: string, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeInteger(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value)

  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback
}

export function normalizeRoomCapacity(
  capacity: Partial<RoomCapacity>
): RoomCapacity & {
  maxAdults: number
  maxChildren: number
  childAgeMax: number
} {
  const fallbackGuests = Math.max(1, normalizeInteger(capacity.maxGuests, 1))
  const rawAdults = normalizeInteger(capacity.maxAdults, fallbackGuests)
  const rawChildren = normalizeInteger(capacity.maxChildren, 0)
  const maxAdults = Math.max(1, rawAdults)
  const maxChildren = rawChildren
  const maxGuests = Math.max(1, maxAdults + maxChildren)
  const childAgeMax = Math.max(1, normalizeInteger(capacity.childAgeMax, 6))

  return {
    maxGuests,
    maxAdults,
    maxChildren,
    childAgeMax,
    bedrooms: normalizeInteger(capacity.bedrooms, 0),
    bathrooms: normalizeInteger(capacity.bathrooms, 0),
    beds: normalizeInteger(capacity.beds, 0),
  }
}

export function getRoomGuestSummary(capacity: Partial<RoomCapacity>) {
  const normalized = normalizeRoomCapacity(capacity)
  const parts = [
    normalized.maxAdults > 0 ? `${normalized.maxAdults} người lớn` : "",
    normalized.maxChildren > 0
      ? `${normalized.maxChildren} trẻ em (<= ${normalized.childAgeMax} tuổi)`
      : "",
  ].filter(Boolean)

  return parts.length ? parts.join(" | ") : `${normalized.maxGuests} khách`
}
