import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm"

import { db } from "@/db/client"
import {
  appUsers,
  auditLogs,
  listingMedia,
  listings,
  suppliers,
} from "@/db/schema"
import { makeId } from "@/lib/admin/helpers"
import type {
  AdminUnifiedListing,
  ListingImage,
  UnifiedListing,
} from "@/lib/listings/types"
import {
  unifiedListingSchema,
  type UnifiedListingInput,
} from "@/lib/validation/listing"

type ListingRow = typeof listings.$inferSelect
type ListingMediaRow = typeof listingMedia.$inferSelect

type SaveListingContext =
  | {
      mode: "owner"
      actor: string
      ownerUserId: string
    }
  | {
      mode: "admin"
      actor: string
    }

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0)
}

function dateIso(value: Date | string | null | undefined) {
  return new Date(value ?? Date.now()).toISOString()
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120)
}

async function nextListingCode(stayType: "long_stay" | "short_stay") {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await db.execute<{ sequence_value: string }>(
      sql`select nextval('rental_listing_code_seq')::text as sequence_value`
    )
    const sequence = String(result.rows[0]?.sequence_value ?? Date.now())
    const suffix = sequence.padStart(6, "0")
    const code = stayType === "short_stay" ? `PH-${suffix}` : `PT${suffix}`
    const existing = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.code, code))
      .limit(1)

    if (!existing[0]) return code
  }

  throw new Error("Không thể tạo mã tin đăng duy nhất.")
}

async function mediaFor(ids: string[]) {
  if (!ids.length) return []
  return db
    .select()
    .from(listingMedia)
    .where(inArray(listingMedia.listingId, ids))
    .orderBy(asc(listingMedia.sortOrder))
}

function toUnifiedListing(
  row: ListingRow,
  mediaRows: ListingMediaRow[]
): UnifiedListing {
  const images = mediaRows
    .filter((item) => item.type === "image")
    .map(
      (item): ListingImage => ({
        id: item.id,
        url: item.url,
        caption: item.caption ?? "",
        isThumbnail: item.isThumbnail,
      })
    )

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    stayType: row.stayType,
    ownerUserId: row.ownerUserId ?? undefined,
    supplierId: row.supplierId ?? undefined,
    title: row.name,
    accommodationTypes: row.accommodationTypes ?? [],
    otherAccommodationType:
      row.otherAccommodationType ?? row.otherRentalType ?? "",
    description: row.description,
    address: {
      addressSystem: "new",
      newProvinceCode: row.newProvinceCode ?? 0,
      newProvinceName: row.newProvinceName ?? row.provinceCity,
      newWardCode: row.newWardCode ?? 0,
      newWardName: row.newWardName ?? row.newWard,
      legacyProvinceCode: row.legacyProvinceCode ?? 0,
      legacyProvinceName: row.legacyProvinceName ?? row.city,
      legacyDistrictCode: row.legacyDistrictCode ?? 0,
      legacyDistrictName: row.legacyDistrictName ?? row.legacyDistrict,
      legacyWardCode: row.legacyWardCode ?? 0,
      legacyWardName: row.legacyWardName ?? row.legacyWard,
      addressDetail: row.addressDetail,
      googleMapsUrl: row.googleMapsUrl ?? "",
      nearbyPlaces:
        row.nearbyPlaces?.length > 0 ? row.nearbyPlaces : row.nearbyTags,
    },
    longStay: {
      ownerLivesOnSite:
        row.ownerLivesOnSite === null
          ? ""
          : row.ownerLivesOnSite
            ? "yes"
            : "no",
      monthlyPrice: numberValue(row.monthlyPrice),
      areaM2: row.areaM2 ?? undefined,
      maxOccupants: row.maxOccupants,
      minimumLeaseMonths: row.minimumLeaseMonths ?? 0,
    },
    shortStay: {
      nightlyPrice:
        numberValue(row.weekdayCustomerPrice) ||
        numberValue(row.referencePrice),
      maxAdults: row.maxAdults,
      maxChildren: row.maxChildren,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      checkIn: row.policies?.checkInTime ?? "",
      checkOut: row.policies?.checkOutTime ?? "",
    },
    otherCosts: row.otherCosts ?? "",
    amenities: row.amenities ?? [],
    customAmenities: row.customAmenities ?? [],
    policyDescription:
      row.policyDescription ?? row.policies?.otherPolicy ?? "",
    allowedRules: row.allowedRules ?? [],
    disallowedRules: row.disallowedRules ?? [],
    media: {
      images,
      videoUrls: mediaRows
        .filter((item) => item.type === "video")
        .map((item) => item.url),
    },
    publicationStatus: row.publicationStatus,
    availabilityStatus: row.availabilityStatus,
    admin: {
      supplierPrice: numberValue(row.supplierPrice),
      commissionType: row.commissionType,
      commissionValue: numberValue(row.commissionValue),
      specialCustomerPrice: numberValue(row.specialCustomerPrice),
      metaTitle: row.metaTitle ?? "",
      metaDescription: row.metaDescription ?? "",
    },
    internalNote: row.internalNote ?? "",
    hiddenReason: row.hiddenReason ?? "",
    isFeatured: row.isFeatured,
    displayPriority: row.displayPriority,
    createdAt: dateIso(row.createdAt),
    updatedAt: dateIso(row.updatedAt),
  }
}

export async function listOwnerListings(ownerUserId: string) {
  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.ownerUserId, ownerUserId),
        isNull(listings.deletedAt)
      )
    )
    .orderBy(desc(listings.updatedAt))
  const mediaRows = await mediaFor(rows.map((row) => row.id))

  return rows.map((row) =>
    toUnifiedListing(
      row,
      mediaRows.filter((item) => item.listingId === row.id)
    )
  )
}

export async function getOwnerListing(ownerUserId: string, id: string) {
  const rows = await db
    .select()
    .from(listings)
    .where(
      and(
        eq(listings.id, id),
        eq(listings.ownerUserId, ownerUserId),
        isNull(listings.deletedAt)
      )
    )
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return toUnifiedListing(row, await mediaFor([row.id]))
}

export async function getAdminListing(id: string) {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), isNull(listings.deletedAt)))
    .limit(1)
  const row = rows[0]
  if (!row) return null
  return toUnifiedListing(row, await mediaFor([row.id]))
}

export async function listAdminListings(): Promise<AdminUnifiedListing[]> {
  const rows = await db
    .select({
      listing: listings,
      ownerName: appUsers.displayName,
      ownerEmail: appUsers.email,
      ownerPhone: appUsers.phone,
      ownerVerified: appUsers.isVerified,
      supplierName: suppliers.fullName,
      supplierCode: suppliers.code,
    })
    .from(listings)
    .leftJoin(appUsers, eq(listings.ownerUserId, appUsers.id))
    .leftJoin(suppliers, eq(listings.supplierId, suppliers.id))
    .where(isNull(listings.deletedAt))
    .orderBy(desc(listings.updatedAt))
  const mediaRows = await mediaFor(rows.map(({ listing }) => listing.id))

  return rows.map((row) => ({
    ...toUnifiedListing(
      row.listing,
      mediaRows.filter((item) => item.listingId === row.listing.id)
    ),
    source: row.listing.source,
    ownerName: row.ownerName ?? row.supplierName ?? "",
    ownerEmail: row.ownerEmail ?? "",
    ownerPhone: row.ownerPhone ?? "",
    ownerVerified:
      row.listing.source === "admin" ? true : Boolean(row.ownerVerified),
    supplierName: row.supplierName ?? "",
    supplierCode: row.supplierCode ?? "",
  }))
}

function roomStatus(
  publicationStatus: UnifiedListingInput["publicationStatus"]
) {
  if (publicationStatus === "published") return "published" as const
  if (publicationStatus === "hidden") return "hidden" as const
  if (publicationStatus === "archived") return "discontinued" as const
  return "pending_completion" as const
}

export async function saveUnifiedListing(
  input: unknown,
  context: SaveListingContext
) {
  const parsed = unifiedListingSchema.parse(input)
  const existingRows = parsed.id
    ? await db
        .select()
        .from(listings)
        .where(eq(listings.id, parsed.id))
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

  const id = existing?.id ?? makeId("listing")
  const code = existing?.code ?? (await nextListingCode(parsed.stayType))
  const source =
    context.mode === "owner"
      ? "self_service"
      : (existing?.source ?? "admin")
  const ownerUserId =
    context.mode === "owner"
      ? context.ownerUserId
      : (existing?.ownerUserId ?? null)
  const supplierId =
    source === "admin"
      ? parsed.supplierId || existing?.supplierId || null
      : null
  const publicationStatus =
    context.mode === "admin"
      ? parsed.publicationStatus
      : (existing?.publicationStatus === "hidden" ? "hidden" : "published")
  const now = new Date()
  const primaryType = parsed.accommodationTypes[0]
  const nightlyPrice = String(parsed.shortStay.nightlyPrice)
  const policies = {
    checkInTime: parsed.shortStay.checkIn,
    checkOutTime: parsed.shortStay.checkOut,
    smoking: existing?.policies?.smoking ?? "not_allowed",
    pets: existing?.policies?.pets ?? "not_allowed",
    cancellationType: existing?.policies?.cancellationType ?? "conditional",
    cancellationDetail: existing?.policies?.cancellationDetail ?? "",
    depositRequired: existing?.policies?.depositRequired ?? false,
    depositDetail: existing?.policies?.depositDetail ?? "",
    minimumNights: existing?.policies?.minimumNights ?? 1,
    quietHours: existing?.policies?.quietHours ?? "",
    otherPolicy: parsed.policyDescription,
  } as const
  const values = {
    stayType: parsed.stayType,
    source,
    ownerUserId,
    supplierId,
    name: parsed.title,
    slug:
      existing?.slug ||
      `${slugify(parsed.title) || "tin-dang"}-${code.toLowerCase()}`,
    status: roomStatus(publicationStatus),
    publicationStatus,
    availabilityStatus: parsed.availabilityStatus,
    isFeatured:
      context.mode === "admin"
        ? parsed.isFeatured
        : (existing?.isFeatured ?? false),
    displayPriority:
      context.mode === "admin"
        ? parsed.displayPriority
        : (existing?.displayPriority ?? 0),
    accommodationTypes:
      parsed.accommodationTypes as ListingRow["accommodationTypes"],
    otherAccommodationType: parsed.otherAccommodationType || null,
    rentalType: (
      [
        "boarding_room",
        "mini_apartment",
        "room_in_house",
        "dormitory",
        "whole_house",
        "apartment",
        "other",
      ].includes(primaryType)
        ? primaryType
        : "other"
    ) as ListingRow["rentalType"],
    otherRentalType: parsed.otherAccommodationType || null,
    description: parsed.description,
    areaM2: parsed.longStay.areaM2 ?? null,
    ownerLivesOnSite:
      parsed.longStay.ownerLivesOnSite === ""
        ? null
        : parsed.longStay.ownerLivesOnSite === "yes",
    minimumLeaseMonths: parsed.longStay.minimumLeaseMonths,
    monthlyPrice: String(parsed.longStay.monthlyPrice),
    maxOccupants: parsed.longStay.maxOccupants,
    maxGuests:
      parsed.stayType === "short_stay"
        ? parsed.shortStay.maxAdults + parsed.shortStay.maxChildren
        : parsed.longStay.maxOccupants,
    maxAdults: parsed.shortStay.maxAdults,
    maxChildren: parsed.shortStay.maxChildren,
    bedrooms: parsed.shortStay.bedrooms,
    bathrooms: parsed.shortStay.bathrooms,
    weekdayCustomerPrice: nightlyPrice,
    specialCustomerPrice:
      context.mode === "admin"
        ? String(parsed.admin.specialCustomerPrice)
        : (existing?.specialCustomerPrice ?? nightlyPrice),
    referencePrice: nightlyPrice,
    supplierPrice:
      context.mode === "admin"
        ? String(parsed.admin.supplierPrice)
        : (existing?.supplierPrice ?? "0"),
    commissionType:
      context.mode === "admin"
        ? parsed.admin.commissionType
        : (existing?.commissionType ?? "percentage"),
    commissionValue:
      context.mode === "admin"
        ? String(parsed.admin.commissionValue)
        : (existing?.commissionValue ?? "0"),
    provinceCity: parsed.address.newProvinceName,
    districtCity: parsed.address.legacyDistrictName,
    city: parsed.address.legacyProvinceName,
    newProvinceCode: parsed.address.newProvinceCode,
    newProvinceName: parsed.address.newProvinceName,
    newWardCode: parsed.address.newWardCode,
    newWardName: parsed.address.newWardName,
    legacyProvinceCode: parsed.address.legacyProvinceCode,
    legacyProvinceName: parsed.address.legacyProvinceName,
    legacyDistrictCode: parsed.address.legacyDistrictCode,
    legacyDistrictName: parsed.address.legacyDistrictName,
    legacyWardCode: parsed.address.legacyWardCode,
    legacyWardName: parsed.address.legacyWardName,
    newWard: parsed.address.newWardName,
    legacyWard: parsed.address.legacyWardName,
    legacyDistrict: parsed.address.legacyDistrictName,
    addressDetail: parsed.address.addressDetail,
    googleMapsUrl: parsed.address.googleMapsUrl || null,
    nearbyTags: uniqueStrings(parsed.address.nearbyPlaces),
    nearbyPlaces: uniqueStrings(parsed.address.nearbyPlaces),
    policies,
    policyDescription: parsed.policyDescription,
    smoking: policies.smoking,
    pets: policies.pets,
    cancellationType: policies.cancellationType,
    otherCosts: parsed.otherCosts,
    amenities: uniqueStrings(parsed.amenities),
    customAmenities: uniqueStrings(parsed.customAmenities),
    allowedRules: uniqueStrings(parsed.allowedRules),
    disallowedRules: uniqueStrings(parsed.disallowedRules),
    internalNote:
      context.mode === "admin"
        ? parsed.internalNote
        : (existing?.internalNote ?? ""),
    metaTitle:
      context.mode === "admin"
        ? parsed.admin.metaTitle
        : (existing?.metaTitle ?? ""),
    metaDescription:
      context.mode === "admin"
        ? parsed.admin.metaDescription
        : (existing?.metaDescription ?? ""),
    updatedAt: now,
    updatedBy: context.actor,
    deletedAt: null,
  }

  await db.transaction(async (tx) => {
    if (existing) {
      await tx.update(listings).set(values).where(eq(listings.id, id))
    } else {
      await tx.insert(listings).values({
        ...values,
        id,
        code,
        weekdaySupplierPrice: "0",
        specialSupplierPrice: "0",
        weekdayPriceUnit: "per_night",
        specialPriceUnit: "per_night",
        weekdayDays: [],
        priceUnit: "per_night",
        distanceToCenter: "not_declared",
        createdAt: now,
        createdBy: context.actor,
      })
    }

    await tx.delete(listingMedia).where(eq(listingMedia.listingId, id))
    const imageRows = parsed.media.images.map((image, index) => ({
      id: image.id,
      listingId: id,
      type: "image" as const,
      url: image.url,
      provider: image.url.startsWith("/uploads/") ? "local" : "external",
      caption: image.caption,
      sortOrder: index,
      isThumbnail: image.isThumbnail,
    }))
    const videoRows = parsed.media.videoUrls.map((url, index) => ({
      id: makeId("listing-video"),
      listingId: id,
      type: "video" as const,
      url,
      provider: "external_embed",
      caption: "",
      sortOrder: index,
      isThumbnail: false,
    }))
    if (imageRows.length || videoRows.length) {
      await tx.insert(listingMedia).values([...imageRows, ...videoRows])
    }
    await tx.insert(auditLogs).values({
      id: makeId("audit"),
      actorEmail: context.actor,
      entityType: "listing",
      entityId: id,
      action: existing ? "update" : "create",
      changedFields: ["listing", "listing_media"],
    })
  })

  return context.mode === "owner"
    ? getOwnerListing(context.ownerUserId, id)
    : getAdminListing(id)
}

export async function updateAdminListingPublicationStatus(
  id: string,
  publicationStatus: UnifiedListing["publicationStatus"],
  actor: string
) {
  const rows = await db
    .update(listings)
    .set({
      publicationStatus,
      status: roomStatus(publicationStatus),
      hiddenReason:
        publicationStatus === "hidden" ? "Ẩn bởi quản trị viên." : "",
      updatedAt: new Date(),
      updatedBy: actor,
    })
    .where(and(eq(listings.id, id), isNull(listings.deletedAt)))
    .returning({ id: listings.id })

  if (!rows[0]) return null

  await db.insert(auditLogs).values({
    id: makeId("audit"),
    actorEmail: actor,
    entityType: "listing",
    entityId: id,
    action: `set_publication_status:${publicationStatus}`,
    changedFields: ["publication_status", "status", "hidden_reason"],
  })

  return getAdminListing(id)
}

export async function archiveOwnerListing(ownerUserId: string, id: string) {
  const rows = await db
    .update(listings)
    .set({
      publicationStatus: "archived",
      status: "discontinued",
      updatedAt: new Date(),
    })
    .where(
      and(eq(listings.id, id), eq(listings.ownerUserId, ownerUserId))
    )
    .returning({ id: listings.id })
  return Boolean(rows[0])
}
