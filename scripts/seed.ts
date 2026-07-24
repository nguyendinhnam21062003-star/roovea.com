import * as nextEnv from "@next/env"
import { sql } from "drizzle-orm"

const loadEnvConfig =
  nextEnv.loadEnvConfig ??
  (nextEnv as typeof nextEnv & { default?: typeof nextEnv }).default
    ?.loadEnvConfig

if (!loadEnvConfig) {
  throw new Error("Cannot load Next.js environment variables.")
}

loadEnvConfig(process.cwd())

import {
  appUsers,
  appUserSessions,
  auditLogs,
  contactChannels,
  customerInquiries,
  rentalListingMedia,
  rentalListings,
  roomMedia,
  rooms,
  suppliers,
} from "../db/schema"
import {
  makeId,
  normalizeRoomCapacity,
  normalizeRoomPricing,
} from "../lib/admin/helpers"
import { seedRooms, seedSuppliers } from "../lib/admin/mock-data"
import { defaultContactChannels } from "../lib/contact"
import { demoRentalListings } from "../lib/rentals/mock-data"
import { encryptField } from "../lib/security/field-encryption"

async function main() {
  const { db, pool } = await import("../db/client")

  try {
    await db.delete(auditLogs)
    await db.delete(customerInquiries)
    await db.delete(contactChannels)
    await db.delete(rentalListingMedia)
    await db.delete(rentalListings)
    await db.delete(appUserSessions)
    await db.delete(appUsers)
    await db.delete(roomMedia)
    await db.delete(rooms)
    await db.delete(suppliers)

    await db.insert(contactChannels).values(
      defaultContactChannels.map((channel, index) => ({
        id: channel.id,
        type: channel.type,
        label: channel.label,
        content: channel.content,
        href: channel.href,
        external: channel.external,
        enabled: channel.enabled,
        sortOrder: index,
        logoSrc: channel.logoSrc,
        logoAlt: channel.logoAlt,
        appendRoomMessage: channel.appendRoomMessage,
      }))
    )

    await db.insert(suppliers).values(
      seedSuppliers.map((supplier) => {
        const citizenId = supplier.citizenId.replace(/\D/g, "")

        return {
          id: supplier.id,
          code: supplier.supplierCode,
          fullName: supplier.fullName,
          nationalIdCiphertext: citizenId ? encryptField(citizenId) : null,
          nationalIdLast4: citizenId ? citizenId.slice(-4) : null,
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
          createdAt: new Date(supplier.createdAt),
          updatedAt: new Date(supplier.updatedAt),
        }
      })
    )

    const seededOwnerId = "user-rental-demo"

    await db.insert(appUsers).values({
      id: seededOwnerId,
      googleSubject: "seed-google-subject",
      email: "chunha.demo@roovea.local",
      displayName: "Chủ nhà demo",
      phone: "0909000111",
      zalo: "0909000111",
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: "seed@roovea.local",
      lastLoginAt: new Date(),
    })

    for (const room of seedRooms) {
      const capacity = normalizeRoomCapacity(room.capacity)
      const pricing = normalizeRoomPricing(room.pricing)

      await db.insert(rooms).values({
        id: room.id,
        stayType: "short_stay",
        source: "admin",
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
        maxGuests: capacity.maxGuests,
        maxAdults: capacity.maxAdults,
        maxChildren: capacity.maxChildren,
        childAgeMax: capacity.childAgeMax,
        bedrooms: capacity.bedrooms,
        bathrooms: capacity.bathrooms,
        beds: capacity.beds,
        supplierId: room.supplierId ?? null,
        supplierPrice: String(pricing.supplierPrice),
        weekdaySupplierPrice: String(pricing.weekdaySupplierPrice),
        specialSupplierPrice: String(pricing.specialSupplierPrice),
        commissionType: pricing.commissionType,
        commissionValue: String(pricing.commissionValue),
        referencePrice: String(pricing.referencePrice),
        weekdayCustomerPrice: String(pricing.weekdayCustomerPrice),
        specialCustomerPrice: String(pricing.specialCustomerPrice),
        priceUnit: pricing.priceUnit,
        weekdayPriceUnit: pricing.weekdayPriceUnit,
        specialPriceUnit: pricing.specialPriceUnit,
        weekdayUnitCount: pricing.weekdayUnitCount,
        specialUnitCount: pricing.specialUnitCount,
        weekdayDays: pricing.weekdayDays,
        priceNote: pricing.priceNote,
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
        internalNote: room.internalNote ?? "",
        internalPolicyUrl: room.internalPolicyUrl ?? "",
        metaTitle: room.seo.metaTitle,
        metaDescription: room.seo.metaDescription,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
        createdBy: room.createdBy,
        updatedBy: room.updatedBy,
      })

      const imageRows = room.media.images.map((image, index) => ({
        id: image.id,
        listingId: room.id,
        type: "image" as const,
        url: image.url,
        provider: image.url.startsWith("/uploads/") ? "local" : "external",
        caption: image.caption,
        sortOrder: index,
        isThumbnail: image.isThumbnail,
      }))
      const videoRows = room.media.videoUrls.map((url, index) => ({
        id: makeId("room-video"),
        listingId: room.id,
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

    for (const [index, rental] of demoRentalListings.entries()) {
      const isSelfService = index === 0

      await db.insert(rentalListings).values({
        id: rental.id,
        stayType: "long_stay",
        code: rental.code,
        source: isSelfService ? "self_service" : "admin",
        ownerUserId: isSelfService ? seededOwnerId : null,
        supplierId: isSelfService
          ? null
          : seedSuppliers[index % seedSuppliers.length]?.id,
        name: rental.name,
        publicationStatus: rental.publicationStatus,
        availabilityStatus: rental.availabilityStatus,
        rentalType: rental.rentalType,
        otherRentalType: rental.otherRentalType,
        description: rental.description,
        monthlyPrice: String(rental.monthlyPrice),
        areaM2: rental.areaM2,
        maxOccupants: rental.maxOccupants,
        city: rental.city,
        newWard: rental.newWard,
        legacyWard: rental.legacyWard,
        legacyDistrict: rental.legacyDistrict,
        addressDetail: rental.addressDetail,
        googleMapsUrl: rental.googleMapsUrl,
        nearbyPlaces: rental.nearbyPlaces,
        electricityPrice: rental.electricityPrice,
        waterPrice: rental.waterPrice,
        otherCosts: rental.otherCosts,
        amenities: rental.amenities,
        customAmenities: rental.customAmenities,
        allowedRules: rental.allowedRules,
        disallowedRules: rental.disallowedRules,
        internalNote: rental.internalNote,
        hiddenReason: rental.hiddenReason,
        createdAt: new Date(rental.createdAt),
        updatedAt: new Date(rental.updatedAt),
        createdBy: isSelfService
          ? "chunha.demo@roovea.local"
          : "seed@roovea.local",
        updatedBy: "seed@roovea.local",
      })

      if (rental.media.images.length) {
        await db.insert(rentalListingMedia).values(
          rental.media.images.map((image, imageIndex) => ({
            id: image.id,
            listingId: rental.id,
            type: "image" as const,
            url: image.url,
            provider: "external",
            caption: image.caption,
            sortOrder: imageIndex,
            isThumbnail: image.isThumbnail,
          }))
        )
      }
    }

    await db.execute(
      sql`SELECT setval('rental_listing_code_seq', ${demoRentalListings.length}, true)`
    )

    const seededRoom = seedRooms.find((room) => room.status === "published")

    await db.insert(customerInquiries).values([
      {
        id: makeId("inquiry"),
        status: "new",
        source: "chat_widget_home",
        customerName: "Khách cần tư vấn",
        phone: "0901234567",
        phoneLast4: "4567",
        message: "Tôi cần phòng cho 4 khách ở Đà Nẵng cuối tuần này.",
        routePath: "/",
        consentAt: new Date(),
      },
      {
        id: makeId("inquiry"),
        status: "read",
        source: "chat_widget_room",
        roomId: seededRoom?.id ?? null,
        customerName: "Nguyễn Minh",
        phone: "0912345678",
        phoneLast4: "5678",
        message: seededRoom
          ? `Tôi muốn hỏi thêm về ${seededRoom.roomCode}.`
          : "Tôi muốn hỏi thêm về một phòng nổi bật.",
        routePath: seededRoom ? `/phong/${seededRoom.seo.slug}` : "/",
        consentAt: new Date(),
        readAt: new Date(),
      },
    ])
  } finally {
    await pool.end()
  }
}

main()
  .then(() => {
    console.log("Seeded Roovea database.")
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
