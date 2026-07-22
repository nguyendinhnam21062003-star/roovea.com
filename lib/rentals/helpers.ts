import type { RentalListing } from "@/lib/rentals/types"

export function buildEmptyRentalListing(): RentalListing {
  const now = new Date().toISOString()

  return {
    id: "",
    code: "",
    source: "self_service",
    name: "",
    publicationStatus: "draft",
    availabilityStatus: "available",
    rentalType: "boarding_room",
    otherRentalType: "",
    description: "",
    monthlyPrice: 0,
    areaM2: 0,
    maxOccupants: 1,
    city: "TP. Hồ Chí Minh",
    newWard: "",
    legacyWard: "",
    legacyDistrict: "",
    addressDetail: "",
    googleMapsUrl: "",
    nearbyPlaces: [],
    electricityPrice: "",
    waterPrice: "",
    otherCosts: "",
    amenities: [],
    customAmenities: [],
    allowedRules: [],
    disallowedRules: [],
    media: { images: [], videoUrls: [] },
    internalNote: "",
    hiddenReason: "",
    createdAt: now,
    updatedAt: now,
  }
}

export function parseRentalTextList(value: string, maxItems = 30) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, maxItems)
}

export function getRentalThumbnail(rental: RentalListing) {
  return (
    rental.media.images.find((image) => image.isThumbnail) ??
    rental.media.images[0] ??
    null
  )
}
