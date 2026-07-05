import "server-only"

import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm"

import { db } from "@/db/client"
import {
  auditLogs,
  customerInquiries,
  roomMedia,
  rooms,
  suppliers,
} from "@/db/schema"
import {
  copyRoomForDuplicate,
  getNextRoomSequence,
  getNextSupplierSequence,
  makeId,
  resolveRoomStatus,
  withAutomaticRoomSeo,
} from "@/lib/admin/helpers"
import { seedRooms, seedSuppliers } from "@/lib/admin/mock-data"
import type {
  Room,
  RoomImage,
  Supplier,
  SupplierStatus,
} from "@/lib/admin/types"
import { roomSchema, supplierSchema } from "@/lib/validation/admin"
import { decryptField, encryptField } from "@/lib/security/field-encryption"
import { stripHtml } from "@/lib/validation/shared"

type RoomRow = typeof rooms.$inferSelect
type SupplierRow = typeof suppliers.$inferSelect
type RoomMediaRow = typeof roomMedia.$inferSelect

function nowIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return new Date().toISOString().slice(0, 10)
  }

  return new Date(value).toISOString().slice(0, 10)
}

function numberFromDb(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  return Number(value)
}

function supplierToAdmin(row: SupplierRow): Supplier {
  return {
    id: row.id,
    supplierCode: row.code,
    fullName: row.fullName,
    citizenId: "",
    citizenIdMasked: row.nationalIdLast4 ? `••••${row.nationalIdLast4}` : "",
    age: row.age ?? undefined,
    gender: row.gender ?? "prefer_not_to_say",
    address: row.address ?? "",
    phone: row.phone ?? "",
    zalo: row.zalo ?? row.phone ?? "",
    facebookUrl: row.facebookUrl ?? "",
    tiktokUrl: row.tiktokUrl ?? "",
    email: row.email ?? "",
    serviceAreas: row.serviceAreas ?? [],
    serviceTypes: row.serviceTypes ?? [],
    accommodationTypes: row.accommodationTypes ?? [],
    status: row.status,
    internalNote: row.internalNote ?? "",
    createdAt: nowIsoDate(row.createdAt),
    updatedAt: nowIsoDate(row.updatedAt),
  }
}

function roomToAdmin(row: RoomRow, mediaRows: RoomMediaRow[]): Room {
  const imageRows = mediaRows
    .filter((item) => item.type === "image")
    .sort((first, second) => first.sortOrder - second.sortOrder)
  const videoRows = mediaRows
    .filter((item) => item.type === "video")
    .sort((first, second) => first.sortOrder - second.sortOrder)
  const images = imageRows.map((item): RoomImage => ({
    id: item.id,
    url: item.url,
    caption: item.caption ?? "",
    isThumbnail: item.isThumbnail,
  }))

  return {
    id: row.id,
    roomCode: row.code,
    name: row.name,
    status: row.status,
    accommodationTypes: row.accommodationTypes ?? [],
    otherAccommodationType: row.otherAccommodationType ?? "",
    description: row.description,
    areaM2: row.areaM2 ?? undefined,
    capacity: {
      maxGuests: row.maxGuests,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      beds: row.beds,
    },
    supplierId: row.supplierId ?? undefined,
    pricing: {
      supplierPrice: numberFromDb(row.supplierPrice),
      commissionType: row.commissionType,
      commissionValue: numberFromDb(row.commissionValue),
      referencePrice: numberFromDb(row.referencePrice),
      strikethroughPrice: row.strikethroughPrice
        ? numberFromDb(row.strikethroughPrice)
        : undefined,
      priceUnit: row.priceUnit,
      priceNote: row.priceNote ?? "",
    },
    location: {
      provinceCity: row.provinceCity,
      districtCity: row.districtCity ?? "",
      addressDetail: row.addressDetail,
      googleMapsUrl: row.googleMapsUrl ?? "",
      nearbyTags: row.nearbyTags ?? [],
      distanceToCenter: row.distanceToCenter,
    },
    policies: row.policies,
    amenities: row.amenities ?? [],
    customAmenities: row.customAmenities ?? [],
    media: {
      images,
      videoUrls: videoRows.map((item) => item.url),
    },
    seo: {
      slug: row.slug,
      metaTitle: row.metaTitle ?? "",
      metaDescription: row.metaDescription ?? "",
      shareThumbnailImageId: images.find((item) => item.isThumbnail)?.id,
    },
    isFeatured: row.isFeatured,
    displayPriority: row.displayPriority,
    createdAt: nowIsoDate(row.createdAt),
    updatedAt: nowIsoDate(row.updatedAt),
    createdBy: row.createdBy ?? "Admin",
    updatedBy: row.updatedBy ?? "Admin",
  }
}

export async function listAdminSuppliers() {
  const rows = await db
    .select()
    .from(suppliers)
    .where(isNull(suppliers.deletedAt))
    .orderBy(desc(suppliers.createdAt))

  return rows.map(supplierToAdmin)
}

export async function listAdminRooms() {
  const [roomRows, mediaRows] = await Promise.all([
    db
      .select()
      .from(rooms)
      .where(isNull(rooms.deletedAt))
      .orderBy(desc(rooms.createdAt)),
    db.select().from(roomMedia),
  ])

  return roomRows.map((room) =>
    roomToAdmin(
      room,
      mediaRows.filter((item) => item.roomId === room.id)
    )
  )
}

export async function getAdminBootstrapData() {
  const [roomList, supplierList, newInquiryRows] = await Promise.all([
    listAdminRooms(),
    listAdminSuppliers(),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerInquiries)
      .where(eq(customerInquiries.status, "new")),
  ])

  return {
    databaseReady: true,
    nextRoomCode: `PH-${String(getNextRoomSequence(roomList)).padStart(
      6,
      "0"
    )}`,
    nextSupplierCode: `NCC-${String(
      getNextSupplierSequence(supplierList)
    ).padStart(6, "0")}`,
    rooms: roomList,
    suppliers: supplierList,
    unreadInquiryCount: newInquiryRows[0]?.count ?? 0,
  }
}

export function getDemoAdminBootstrapData() {
  return {
    databaseMessage:
      "Database PostgreSQL chưa sẵn sàng. Bạn đang xem dữ liệu demo; các thao tác lưu/xóa cần chạy Postgres, migration và seed.",
    databaseReady: false,
    nextRoomCode: `PH-${String(getNextRoomSequence(seedRooms)).padStart(6, "0")}`,
    nextSupplierCode: `NCC-${String(
      getNextSupplierSequence(seedSuppliers)
    ).padStart(6, "0")}`,
    rooms: seedRooms,
    suppliers: seedSuppliers.map((supplier) => ({
      ...supplier,
      citizenIdMasked: supplier.citizenId
        ? `••••${supplier.citizenId.slice(-4)}`
        : "",
    })),
    unreadInquiryCount: 0,
  }
}

async function replaceRoomMedia(room: Room) {
  await db.delete(roomMedia).where(eq(roomMedia.roomId, room.id))

  const imageRows = room.media.images.map((image, index) => ({
    id: image.id,
    roomId: room.id,
    type: "image" as const,
    url: image.url,
    provider: image.url.startsWith("/uploads/") ? "local" : "external",
    caption: image.caption,
    sortOrder: index,
    isThumbnail: image.isThumbnail,
  }))
  const videoRows = room.media.videoUrls.map((url, index) => ({
    id: makeId("room-video"),
    roomId: room.id,
    type: "video" as const,
    url,
    provider: "external_embed",
    caption: "",
    sortOrder: index,
    isThumbnail: false,
  }))

  if (imageRows.length || videoRows.length) {
    await db.insert(roomMedia).values([...imageRows, ...videoRows])
  }
}

export async function upsertRoom(roomInput: unknown, actorEmail: string) {
  const parsed = roomSchema.parse(roomInput) as Room
  const room = withAutomaticRoomSeo({
    ...parsed,
    description: stripHtml(parsed.description),
    status: resolveRoomStatus(parsed, parsed.status),
  })
  const now = new Date()
  const values = {
    id: room.id,
    code: room.roomCode,
    name: room.name,
    slug: room.seo.slug,
    status: room.status,
    isFeatured: room.isFeatured,
    displayPriority: room.displayPriority,
    accommodationTypes: room.accommodationTypes,
    otherAccommodationType: room.otherAccommodationType,
    description: room.description,
    areaM2: room.areaM2 ?? null,
    maxGuests: room.capacity.maxGuests,
    bedrooms: room.capacity.bedrooms,
    bathrooms: room.capacity.bathrooms,
    beds: room.capacity.beds,
    supplierId: room.supplierId || null,
    supplierPrice: String(room.pricing.supplierPrice),
    commissionType: room.pricing.commissionType,
    commissionValue: String(room.pricing.commissionValue),
    referencePrice: String(room.pricing.referencePrice),
    strikethroughPrice: room.pricing.strikethroughPrice
      ? String(room.pricing.strikethroughPrice)
      : null,
    priceUnit: room.pricing.priceUnit,
    priceNote: room.pricing.priceNote,
    provinceCity: room.location.provinceCity,
    districtCity: room.location.districtCity,
    addressDetail: room.location.addressDetail,
    googleMapsUrl: room.location.googleMapsUrl,
    nearbyTags: room.location.nearbyTags,
    distanceToCenter: room.location.distanceToCenter,
    policies: room.policies,
    smoking: room.policies.smoking,
    pets: room.policies.pets,
    cancellationType: room.policies.cancellationType,
    amenities: room.amenities,
    customAmenities: room.customAmenities,
    metaTitle: room.seo.metaTitle,
    metaDescription: room.seo.metaDescription,
    createdAt: now,
    updatedAt: now,
    createdBy: room.createdBy || actorEmail,
    updatedBy: actorEmail,
    deletedAt: null,
  }

  await db
    .insert(rooms)
    .values(values)
    .onConflictDoUpdate({
      target: rooms.id,
      set: {
        code: values.code,
        name: values.name,
        slug: values.slug,
        status: values.status,
        isFeatured: values.isFeatured,
        displayPriority: values.displayPriority,
        accommodationTypes: values.accommodationTypes,
        otherAccommodationType: values.otherAccommodationType,
        description: values.description,
        areaM2: values.areaM2,
        maxGuests: values.maxGuests,
        bedrooms: values.bedrooms,
        bathrooms: values.bathrooms,
        beds: values.beds,
        supplierId: values.supplierId,
        supplierPrice: values.supplierPrice,
        commissionType: values.commissionType,
        commissionValue: values.commissionValue,
        referencePrice: values.referencePrice,
        strikethroughPrice: values.strikethroughPrice,
        priceUnit: values.priceUnit,
        priceNote: values.priceNote,
        provinceCity: values.provinceCity,
        districtCity: values.districtCity,
        addressDetail: values.addressDetail,
        googleMapsUrl: values.googleMapsUrl,
        nearbyTags: values.nearbyTags,
        distanceToCenter: values.distanceToCenter,
        policies: values.policies,
        smoking: values.smoking,
        pets: values.pets,
        cancellationType: values.cancellationType,
        amenities: values.amenities,
        customAmenities: values.customAmenities,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        deletedAt: null,
        updatedAt: now,
        updatedBy: actorEmail,
      },
    })

  await replaceRoomMedia(room)
  await writeAuditLog(actorEmail, "room", room.id, "upsert", [
    "room",
    "room_media",
  ])

  return room
}

export async function deleteRoom(id: string, actorEmail: string) {
  await db
    .update(rooms)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: actorEmail,
    })
    .where(eq(rooms.id, id))
  await writeAuditLog(actorEmail, "room", id, "delete", ["deletedAt"])
}

export async function duplicateRoom(id: string, actorEmail: string) {
  const roomList = await listAdminRooms()
  const sourceRoom = roomList.find((room) => room.id === id)

  if (!sourceRoom) {
    return null
  }

  const duplicated = copyRoomForDuplicate(
    sourceRoom,
    `PH-${String(getNextRoomSequence(roomList)).padStart(6, "0")}`
  )
  await upsertRoom({ ...duplicated, updatedBy: actorEmail }, actorEmail)
  await writeAuditLog(actorEmail, "room", duplicated.id, "duplicate", ["id"])

  return duplicated
}

export async function upsertSupplier(
  supplierInput: unknown,
  actorEmail: string
) {
  const supplier = supplierSchema.parse(supplierInput) as Supplier
  const existing = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.id, supplier.id))
    .limit(1)
  const citizenId = supplier.citizenId.replace(/\D/g, "")
  const hasNewCitizenId = /^(\d{9}|\d{12})$/.test(citizenId)
  const now = new Date()
  const values = {
    id: supplier.id,
    code: supplier.supplierCode,
    fullName: supplier.fullName,
    nationalIdCiphertext: hasNewCitizenId
      ? encryptField(citizenId)
      : (existing[0]?.nationalIdCiphertext ?? null),
    nationalIdLast4: hasNewCitizenId
      ? citizenId.slice(-4)
      : (existing[0]?.nationalIdLast4 ?? null),
    age: supplier.age ?? null,
    gender: supplier.gender,
    address: supplier.address,
    serviceAreas: supplier.serviceAreas,
    phone: supplier.phone,
    zalo: supplier.zalo || supplier.phone,
    facebookUrl: supplier.facebookUrl,
    tiktokUrl: supplier.tiktokUrl,
    email: supplier.email,
    serviceTypes: supplier.serviceTypes,
    accommodationTypes: supplier.accommodationTypes,
    status: supplier.status,
    internalNote: supplier.internalNote,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }

  await db
    .insert(suppliers)
    .values(values)
    .onConflictDoUpdate({
      target: suppliers.id,
      set: {
        code: values.code,
        fullName: values.fullName,
        nationalIdCiphertext: values.nationalIdCiphertext,
        nationalIdLast4: values.nationalIdLast4,
        age: values.age,
        gender: values.gender,
        address: values.address,
        serviceAreas: values.serviceAreas,
        phone: values.phone,
        zalo: values.zalo,
        facebookUrl: values.facebookUrl,
        tiktokUrl: values.tiktokUrl,
        email: values.email,
        serviceTypes: values.serviceTypes,
        accommodationTypes: values.accommodationTypes,
        status: values.status,
        internalNote: values.internalNote,
        deletedAt: null,
        updatedAt: now,
      },
    })

  await writeAuditLog(actorEmail, "supplier", supplier.id, "upsert", [
    "supplier",
  ])

  return supplier
}

export async function deleteSupplier(id: string, actorEmail: string) {
  const linkedRooms = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.supplierId, id), isNull(rooms.deletedAt)))

  if (linkedRooms.length > 0) {
    return {
      ok: false,
      reason: `Không thể xóa vì còn ${linkedRooms.length} phòng đang liên kết.`,
    }
  }

  await db
    .update(suppliers)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(suppliers.id, id))
  await writeAuditLog(actorEmail, "supplier", id, "delete", ["deletedAt"])

  return { ok: true }
}

export async function setSupplierStatus(
  id: string,
  status: SupplierStatus,
  actorEmail: string
) {
  await db
    .update(suppliers)
    .set({ status, updatedAt: new Date() })
    .where(eq(suppliers.id, id))
  await writeAuditLog(actorEmail, "supplier", id, "status", ["status"])
}

export async function findSupplierNationalId(id: string) {
  const rows = await db
    .select({ nationalIdCiphertext: suppliers.nationalIdCiphertext })
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1)

  return decryptField(rows[0]?.nationalIdCiphertext)
}

export async function writeAuditLog(
  actorEmail: string,
  entityType: string,
  entityId: string,
  action: string,
  changedFields: string[]
) {
  await db.insert(auditLogs).values({
    id: makeId("audit"),
    actorEmail,
    entityType,
    entityId,
    action,
    changedFields,
  })
}

export async function searchRoomsForInquiry(query: string) {
  const normalized = `%${query.trim()}%`

  return db
    .select({ id: rooms.id, code: rooms.code, name: rooms.name })
    .from(rooms)
    .where(
      and(
        isNull(rooms.deletedAt),
        or(ilike(rooms.name, normalized), ilike(rooms.code, normalized))
      )
    )
    .limit(20)
}

export async function getRoomsByIds(ids: string[]) {
  if (!ids.length) {
    return []
  }

  return db.select().from(rooms).where(inArray(rooms.id, ids))
}
