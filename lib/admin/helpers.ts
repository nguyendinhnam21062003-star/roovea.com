import type {
  CommissionType,
  Room,
  RoomCompletion,
  RoomImage,
  RoomPricing,
  RoomStatus,
  Supplier,
} from "@/lib/admin/types"

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

export function calculateExpectedProfit(pricing: RoomPricing) {
  return (
    pricing.referencePrice -
    pricing.supplierPrice +
    calculateCommissionAmount(
      pricing.supplierPrice,
      pricing.commissionType,
      pricing.commissionValue
    )
  )
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
  const sections = {
    basic:
      Boolean(room.name.trim()) &&
      Boolean(room.roomCode.trim()) &&
      room.accommodationTypes.length > 0 &&
      room.capacity.maxGuests > 0,
    supplier: Boolean(room.supplierId),
    pricing: room.pricing.referencePrice > 0,
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
    missing.push("Giá tham khảo")
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
