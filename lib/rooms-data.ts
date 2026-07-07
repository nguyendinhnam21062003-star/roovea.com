import "server-only"

import { and, asc, eq, isNull } from "drizzle-orm"

import { db } from "@/db/client"
import { roomMedia, rooms } from "@/db/schema"
import { accommodationTypeLabels, getNearbyTagLabel } from "@/lib/admin/options"
import { seedRooms } from "@/lib/admin/mock-data"
import type { AccommodationType, Room, RoomImage } from "@/lib/admin/types"
import type { PublicRoom } from "@/lib/rooms"

type RoomRow = typeof rooms.$inferSelect
type MediaRow = typeof roomMedia.$inferSelect

function numberFromDb(value: string | number | null | undefined) {
  return value ? Number(value) : 0
}

function updatedIso(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toISOString().slice(0, 10)
}

function accommodationLabel(value: AccommodationType | undefined) {
  return value ? accommodationTypeLabels[value] : "Chỗ nghỉ"
}

function mapRoomImages(images: RoomImage[], roomName: string) {
  return [...images]
    .sort(
      (first, second) => Number(second.isThumbnail) - Number(first.isThumbnail)
    )
    .map((item) => ({
      type: "image" as const,
      src: item.url,
      alt: item.caption || roomName,
    }))
}

function mapDemoPublicRoom(room: Room): PublicRoom {
  const imageMedia = mapRoomImages(room.media.images, room.name)
  const videoMedia = room.media.videoUrls.map((url) => ({
    type: "video" as const,
    src: url,
    alt: `Video ${room.name}`,
  }))
  const highlights = room.location.nearbyTags
    .map(getNearbyTagLabel)
    .filter(Boolean)

  return {
    id: room.id,
    slug: room.seo.slug,
    code: room.roomCode.replace(/^PH-/, ""),
    name: room.name,
    referencePrice: room.pricing.referencePrice,
    strikePrice:
      room.pricing.strikethroughPrice ||
      Math.round(room.pricing.referencePrice * 1.15),
    media: [...imageMedia, ...videoMedia],
    description: room.description,
    locationLevel1: room.location.provinceCity,
    locationLevel2: room.location.districtCity || room.location.provinceCity,
    address: room.location.addressDetail,
    googleMapUrl: room.location.googleMapsUrl,
    updatedAt: room.updatedAt,
    featured: room.isFeatured,
    accommodationTypes: room.accommodationTypes,
    otherAccommodationType: room.otherAccommodationType,
    bedrooms: room.capacity.bedrooms,
    guests: room.capacity.maxGuests,
    area: room.areaM2
      ? `${room.areaM2} m2`
      : `${room.capacity.bedrooms} phòng ngủ`,
    highlights:
      highlights.length > 0
        ? highlights
        : [accommodationLabel(room.accommodationTypes[0])],
    policyData: room.policies,
  }
}

function getDemoPublicRooms() {
  return seedRooms
    .filter((room) => room.status === "published")
    .map(mapDemoPublicRoom)
}

function mapPublicRoom(row: RoomRow, mediaRows: MediaRow[]): PublicRoom {
  const imageMedia = mediaRows
    .filter((item) => item.type === "image")
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((item) => ({
      type: "image" as const,
      src: item.url,
      alt: item.caption || row.name,
    }))
  const videoMedia = mediaRows
    .filter((item) => item.type === "video")
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((item) => ({
      type: "video" as const,
      src: item.url,
      alt: item.caption || `Video ${row.name}`,
    }))
  const fallbackMedia =
    imageMedia.length > 0
      ? []
      : [
          {
            type: "image" as const,
            src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
            alt: row.name,
          },
        ]
  const highlights = row.nearbyTags.map(getNearbyTagLabel).filter(Boolean)

  return {
    id: row.id,
    slug: row.slug,
    code: row.code.replace(/^PH-/, ""),
    name: row.name,
    referencePrice: numberFromDb(row.referencePrice),
    strikePrice:
      numberFromDb(row.strikethroughPrice) ||
      Math.round(numberFromDb(row.referencePrice) * 1.15),
    media: [...imageMedia, ...fallbackMedia, ...videoMedia],
    description: row.description,
    locationLevel1: row.provinceCity,
    locationLevel2: row.districtCity || row.provinceCity,
    address: row.addressDetail,
    googleMapUrl: row.googleMapsUrl ?? "",
    updatedAt: updatedIso(row.updatedAt),
    featured: row.isFeatured,
    accommodationTypes: row.accommodationTypes,
    otherAccommodationType: row.otherAccommodationType ?? undefined,
    bedrooms: row.bedrooms,
    guests: row.maxGuests,
    area: row.areaM2 ? `${row.areaM2} m2` : `${row.bedrooms} phòng ngủ`,
    highlights:
      highlights.length > 0
        ? highlights
        : [accommodationLabel(row.accommodationTypes[0])],
    policyData: row.policies,
  }
}

export async function getPublicRooms() {
  try {
    const [roomRows, mediaRows] = await Promise.all([
      db
        .select()
        .from(rooms)
        .where(and(eq(rooms.status, "published"), isNull(rooms.deletedAt)))
        .orderBy(asc(rooms.displayPriority), asc(rooms.createdAt)),
      db.select().from(roomMedia).orderBy(asc(roomMedia.sortOrder)),
    ])

    if (!roomRows.length && process.env.NODE_ENV !== "production") {
      return getDemoPublicRooms()
    }

    return roomRows.map((room) =>
      mapPublicRoom(
        room,
        mediaRows.filter((item) => item.roomId === room.id)
      )
    )
  } catch {
    return getDemoPublicRooms()
  }
}

export async function getPublicRoomBySlug(slug: string) {
  try {
    const rows = await db
      .select()
      .from(rooms)
      .where(eq(rooms.slug, slug))
      .limit(1)
    const room = rows[0]

    if (!room || room.status !== "published" || room.deletedAt) {
      return getDemoPublicRooms().find((item) => item.slug === slug) ?? null
    }

    const mediaRows = await db
      .select()
      .from(roomMedia)
      .where(eq(roomMedia.roomId, room.id))
      .orderBy(asc(roomMedia.sortOrder))

    return mapPublicRoom(room, mediaRows)
  } catch {
    return getDemoPublicRooms().find((item) => item.slug === slug) ?? null
  }
}

export async function getFeaturedRooms() {
  const roomList = await getPublicRooms()

  return roomList.filter((room) => room.featured)
}

export async function getPublicRoomByCode(code: string) {
  const normalized = code.startsWith("PH-") ? code : `PH-${code}`
  const demoCode = normalized.replace(/^PH-/, "")

  try {
    const rows = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, normalized))
      .limit(1)
    const room = rows[0]

    if (!room || room.status !== "published" || room.deletedAt) {
      return getDemoPublicRooms().find((item) => item.code === demoCode) ?? null
    }

    const mediaRows = await db
      .select()
      .from(roomMedia)
      .where(eq(roomMedia.roomId, room.id))

    return mapPublicRoom(room, mediaRows)
  } catch {
    return getDemoPublicRooms().find((item) => item.code === demoCode) ?? null
  }
}
