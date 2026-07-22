import "server-only"

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm"

import { db } from "@/db/client"
import {
  appUsers,
  auditLogs,
  rentalListingMedia,
  rentalListings,
  suppliers,
} from "@/db/schema"
import { makeId } from "@/lib/admin/helpers"
import { demoRentalListings } from "@/lib/rentals/mock-data"
import type {
  AdminRentalListing,
  PublicRentalListing,
  RentalListing,
} from "@/lib/rentals/types"
import {
  getRentalPublishingErrors,
  rentalListingSchema,
} from "@/lib/validation/rental"

type RentalRow = typeof rentalListings.$inferSelect
type RentalMediaRow = typeof rentalListingMedia.$inferSelect

type SaveRentalContext =
  | { actor: string; mode: "owner"; ownerUserId: string; ownerPhone: string }
  | { actor: string; mode: "admin" }

function numberFromDb(value: string | number | null | undefined) {
  return value ? Number(value) : 0
}

function dateIso(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toISOString()
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function rowToRental(row: RentalRow, mediaRows: RentalMediaRow[]): RentalListing {
  const images = mediaRows
    .filter((item) => item.type === "image")
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((item) => ({
      id: item.id,
      url: item.url,
      caption: item.caption ?? "",
      isThumbnail: item.isThumbnail,
    }))
  const videoUrls = mediaRows
    .filter((item) => item.type === "video")
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((item) => item.url)

  return {
    id: row.id,
    code: row.code,
    source: row.source,
    ownerUserId: row.ownerUserId ?? undefined,
    supplierId: row.supplierId ?? undefined,
    name: row.name,
    publicationStatus: row.publicationStatus,
    availabilityStatus: row.availabilityStatus,
    rentalType: row.rentalType,
    otherRentalType: row.otherRentalType ?? "",
    description: row.description,
    monthlyPrice: numberFromDb(row.monthlyPrice),
    areaM2: row.areaM2,
    maxOccupants: row.maxOccupants,
    city: row.city,
    newWard: row.newWard,
    legacyWard: row.legacyWard,
    legacyDistrict: row.legacyDistrict,
    addressDetail: row.addressDetail,
    googleMapsUrl: row.googleMapsUrl ?? "",
    nearbyPlaces: row.nearbyPlaces ?? [],
    electricityPrice: row.electricityPrice,
    waterPrice: row.waterPrice,
    otherCosts: row.otherCosts ?? "",
    amenities: row.amenities ?? [],
    customAmenities: row.customAmenities ?? [],
    allowedRules: row.allowedRules ?? [],
    disallowedRules: row.disallowedRules ?? [],
    media: { images, videoUrls },
    internalNote: row.internalNote ?? "",
    hiddenReason: row.hiddenReason ?? "",
    createdAt: dateIso(row.createdAt),
    updatedAt: dateIso(row.updatedAt),
  }
}

async function getMediaForListings(ids: string[]) {
  if (!ids.length) return []

  return db
    .select()
    .from(rentalListingMedia)
    .where(inArray(rentalListingMedia.rentalListingId, ids))
    .orderBy(asc(rentalListingMedia.sortOrder))
}

export async function getPublicRentalListings(): Promise<
  PublicRentalListing[]
> {
  try {
    const rows = await db
      .select({
        listing: rentalListings,
        ownerVerified: appUsers.isVerified,
      })
      .from(rentalListings)
      .leftJoin(appUsers, eq(rentalListings.ownerUserId, appUsers.id))
      .where(
        and(
          eq(rentalListings.publicationStatus, "published"),
          eq(rentalListings.availabilityStatus, "available"),
          isNull(rentalListings.deletedAt)
        )
      )
      .orderBy(desc(rentalListings.updatedAt))
    const mediaRows = await getMediaForListings(
      rows.map(({ listing }) => listing.id)
    )

    if (!rows.length && process.env.NODE_ENV !== "production") {
      return demoRentalListings
    }

    return rows.map(({ listing, ownerVerified }) => ({
      ...rowToRental(
        listing,
        mediaRows.filter((item) => item.rentalListingId === listing.id)
      ),
      ownerVerified:
        listing.source === "admin" ? true : Boolean(ownerVerified),
    }))
  } catch {
    return process.env.NODE_ENV === "production" ? [] : demoRentalListings
  }
}

export async function getPublicRentalByCode(
  code: string
): Promise<PublicRentalListing | null> {
  const normalizedCode = code.trim().toUpperCase()

  try {
    const rows = await db
      .select({
        listing: rentalListings,
        ownerVerified: appUsers.isVerified,
      })
      .from(rentalListings)
      .leftJoin(appUsers, eq(rentalListings.ownerUserId, appUsers.id))
      .where(
        and(
          eq(rentalListings.code, normalizedCode),
          eq(rentalListings.publicationStatus, "published"),
          isNull(rentalListings.deletedAt)
        )
      )
      .limit(1)
    const row = rows[0]

    if (!row || ["renovating", "paused"].includes(row.listing.availabilityStatus)) {
      return (
        demoRentalListings.find((item) => item.code === normalizedCode) ?? null
      )
    }

    const mediaRows = await getMediaForListings([row.listing.id])
    return {
      ...rowToRental(row.listing, mediaRows),
      ownerVerified:
        row.listing.source === "admin" ? true : Boolean(row.ownerVerified),
    }
  } catch {
    return demoRentalListings.find((item) => item.code === normalizedCode) ?? null
  }
}

export async function listOwnerRentals(ownerUserId: string) {
  const rows = await db
    .select()
    .from(rentalListings)
    .where(
      and(
        eq(rentalListings.ownerUserId, ownerUserId),
        isNull(rentalListings.deletedAt)
      )
    )
    .orderBy(desc(rentalListings.updatedAt))
  const mediaRows = await getMediaForListings(rows.map((row) => row.id))

  return rows.map((row) =>
    rowToRental(
      row,
      mediaRows.filter((item) => item.rentalListingId === row.id)
    )
  )
}

export async function getOwnerRental(ownerUserId: string, id: string) {
  const rows = await db
    .select()
    .from(rentalListings)
    .where(
      and(
        eq(rentalListings.id, id),
        eq(rentalListings.ownerUserId, ownerUserId),
        isNull(rentalListings.deletedAt)
      )
    )
    .limit(1)
  const row = rows[0]

  if (!row) return null

  return rowToRental(row, await getMediaForListings([row.id]))
}

export async function listAdminRentals(): Promise<AdminRentalListing[]> {
  const rows = await db
    .select({
      listing: rentalListings,
      ownerName: appUsers.displayName,
      ownerEmail: appUsers.email,
      ownerPhone: appUsers.phone,
      ownerZalo: appUsers.zalo,
      ownerVerified: appUsers.isVerified,
      supplierName: suppliers.fullName,
      supplierCode: suppliers.code,
      supplierPhone: suppliers.phone,
      supplierZalo: suppliers.zalo,
      supplierEmail: suppliers.email,
    })
    .from(rentalListings)
    .leftJoin(appUsers, eq(rentalListings.ownerUserId, appUsers.id))
    .leftJoin(suppliers, eq(rentalListings.supplierId, suppliers.id))
    .where(isNull(rentalListings.deletedAt))
    .orderBy(desc(rentalListings.updatedAt))
  const mediaRows = await getMediaForListings(
    rows.map(({ listing }) => listing.id)
  )

  return rows.map((row) => ({
    ...rowToRental(
      row.listing,
      mediaRows.filter((item) => item.rentalListingId === row.listing.id)
    ),
    ownerName: row.ownerName ?? row.supplierName ?? "",
    ownerEmail: row.ownerEmail ?? row.supplierEmail ?? "",
    ownerPhone: row.ownerPhone ?? row.supplierPhone ?? "",
    ownerZalo: row.ownerZalo ?? row.supplierZalo ?? "",
    ownerVerified:
      row.listing.source === "admin" ? true : Boolean(row.ownerVerified),
    supplierName: row.supplierName ?? "",
    supplierCode: row.supplierCode ?? "",
  }))
}

export async function getAdminRental(id: string) {
  const rentals = await listAdminRentals()
  return rentals.find((rental) => rental.id === id) ?? null
}

export async function saveRentalListing(
  input: unknown,
  context: SaveRentalContext
) {
  const parsed = rentalListingSchema.parse(input)
  const existingRows = parsed.id
    ? await db
        .select()
        .from(rentalListings)
        .where(eq(rentalListings.id, parsed.id))
        .limit(1)
    : []
  const existing = existingRows[0]

  if (
    context.mode === "owner" &&
    existing &&
    existing.ownerUserId !== context.ownerUserId
  ) {
    return null
  }

  const source =
    context.mode === "owner"
      ? "self_service"
      : (existing?.source ?? "admin")
  const ownerUserId =
    context.mode === "owner"
      ? context.ownerUserId
      : (existing?.ownerUserId ?? undefined)
  const supplierId =
    context.mode === "admin" && source === "admin"
      ? parsed.supplierId || existing?.supplierId || undefined
      : undefined
  let publicationStatus = parsed.publicationStatus

  if (context.mode === "admin" && source === "admin" && !supplierId) {
    const error = new Error("Vui lòng chọn đối tác/chủ nhà.")
    Object.assign(error, {
      fieldErrors: { supplierId: "Vui lòng chọn đối tác/chủ nhà." },
    })
    throw error
  }

  if (context.mode === "owner" && existing?.publicationStatus === "hidden") {
    publicationStatus = "hidden"
  }

  if (publicationStatus === "published") {
    const publishingErrors = getRentalPublishingErrors(parsed, {
      ownerPhone: context.mode === "owner" ? context.ownerPhone : undefined,
      requireSupplier: context.mode === "admin" && source === "admin",
    })

    if (Object.keys(publishingErrors).length) {
      const error = new Error("Tin chưa đủ thông tin để xuất bản.")
      Object.assign(error, { fieldErrors: publishingErrors })
      throw error
    }
  }

  const now = new Date()
  const id = existing?.id ?? makeId("rental")
  const values = {
    source,
    ownerUserId: ownerUserId ?? null,
    supplierId: supplierId || null,
    name: parsed.name,
    publicationStatus,
    availabilityStatus: parsed.availabilityStatus,
    rentalType: parsed.rentalType,
    otherRentalType: parsed.otherRentalType,
    description: parsed.description,
    monthlyPrice: String(parsed.monthlyPrice),
    areaM2: parsed.areaM2,
    maxOccupants: parsed.maxOccupants,
    city: "TP. Hồ Chí Minh",
    newWard: parsed.newWard,
    legacyWard: parsed.legacyWard,
    legacyDistrict: parsed.legacyDistrict,
    addressDetail: parsed.addressDetail,
    googleMapsUrl: parsed.googleMapsUrl || null,
    nearbyPlaces: uniqueStrings(parsed.nearbyPlaces).slice(0, 3),
    electricityPrice: parsed.electricityPrice,
    waterPrice: parsed.waterPrice,
    otherCosts: parsed.otherCosts,
    amenities: uniqueStrings(parsed.amenities),
    customAmenities: uniqueStrings(parsed.customAmenities),
    allowedRules: uniqueStrings(parsed.allowedRules),
    disallowedRules: uniqueStrings(parsed.disallowedRules),
    internalNote: context.mode === "admin" ? parsed.internalNote : existing?.internalNote ?? "",
    hiddenReason:
      context.mode === "admin" ? parsed.hiddenReason : existing?.hiddenReason ?? "",
    updatedAt: now,
    updatedBy: context.actor,
    deletedAt: null,
  }

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(rentalListings)
        .set(values)
        .where(eq(rentalListings.id, id))
    } else {
      await tx.insert(rentalListings).values({
        ...values,
        id,
        createdAt: now,
        createdBy: context.actor,
      })
    }

    await tx
      .delete(rentalListingMedia)
      .where(eq(rentalListingMedia.rentalListingId, id))

    const images = parsed.media.images.map((image, index) => ({
      id: image.id,
      rentalListingId: id,
      type: "image" as const,
      url: image.url,
      provider: image.url.startsWith("/uploads/") ? "local" : "external",
      caption: image.caption,
      sortOrder: index,
      isThumbnail: image.isThumbnail,
    }))
    const videos = parsed.media.videoUrls.map((url, index) => ({
      id: makeId("rental-video"),
      rentalListingId: id,
      type: "video" as const,
      url,
      provider: "external_embed",
      caption: "",
      sortOrder: index,
      isThumbnail: false,
    }))

    if (images.length || videos.length) {
      await tx.insert(rentalListingMedia).values([...images, ...videos])
    }

    await tx.insert(auditLogs).values({
      id: makeId("audit"),
      actorEmail: context.actor,
      entityType: "rental_listing",
      entityId: id,
      action: existing ? "update" : "create",
      changedFields: ["rental_listing", "rental_listing_media"],
    })
  })

  return context.mode === "owner"
    ? getOwnerRental(context.ownerUserId, id)
    : getAdminRental(id)
}

export async function archiveOwnerRental(ownerUserId: string, id: string) {
  const rows = await db
    .update(rentalListings)
    .set({ publicationStatus: "archived", updatedAt: new Date() })
    .where(
      and(
        eq(rentalListings.id, id),
        eq(rentalListings.ownerUserId, ownerUserId)
      )
    )
    .returning({ id: rentalListings.id })

  return Boolean(rows[0])
}

export async function deleteAdminRental(id: string, actorEmail: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(rentalListings)
      .set({ deletedAt: new Date(), updatedBy: actorEmail, updatedAt: new Date() })
      .where(eq(rentalListings.id, id))
    await tx.insert(auditLogs).values({
      id: makeId("audit"),
      actorEmail,
      entityType: "rental_listing",
      entityId: id,
      action: "delete",
      changedFields: ["deletedAt"],
    })
  })
}
