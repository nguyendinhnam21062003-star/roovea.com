import "dotenv/config"

import { db, pool } from "../db/client"
import {
  auditLogs,
  customerInquiries,
  roomMedia,
  rooms,
  suppliers,
} from "../db/schema"
import { makeId } from "../lib/admin/helpers"
import { seedRooms, seedSuppliers } from "../lib/admin/mock-data"
import { encryptField } from "../lib/security/field-encryption"

async function main() {
  await db.delete(auditLogs)
  await db.delete(customerInquiries)
  await db.delete(roomMedia)
  await db.delete(rooms)
  await db.delete(suppliers)

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

  for (const room of seedRooms) {
    await db.insert(rooms).values({
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
      supplierId: room.supplierId ?? null,
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
      createdAt: new Date(room.createdAt),
      updatedAt: new Date(room.updatedAt),
      createdBy: room.createdBy,
      updatedBy: room.updatedBy,
    })

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
}

main()
  .then(async () => {
    await pool.end()
    console.log("Seeded Roovea database.")
  })
  .catch(async (error) => {
    await pool.end()
    console.error(error)
    process.exit(1)
  })
