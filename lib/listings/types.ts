export type ListingStayType = "long_stay" | "short_stay"
export type ListingActorMode = "owner" | "admin"

export type ListingImage = {
  id: string
  url: string
  caption: string
  isThumbnail: boolean
}

export type UnifiedListing = {
  id: string
  code: string
  slug: string
  stayType: ListingStayType
  ownerUserId?: string
  supplierId?: string
  title: string
  accommodationTypes: string[]
  otherAccommodationType: string
  description: string
  address: {
    addressSystem: "new" | "legacy"
    newProvinceCode: number
    newProvinceName: string
    newWardCode: number
    newWardName: string
    legacyProvinceCode: number
    legacyProvinceName: string
    legacyDistrictCode: number
    legacyDistrictName: string
    legacyWardCode: number
    legacyWardName: string
    addressDetail: string
    googleMapsUrl: string
    nearbyPlaces: string[]
  }
  longStay: {
    ownerLivesOnSite: "yes" | "no" | ""
    monthlyPrice: number
    areaM2?: number
    maxOccupants: number
    minimumLeaseMonths: number
  }
  shortStay: {
    nightlyPrice: number
    maxAdults: number
    maxChildren: number
    bedrooms: number
    bathrooms: number
    checkIn: string
    checkOut: string
  }
  otherCosts: string
  amenities: string[]
  customAmenities: string[]
  policyDescription: string
  allowedRules: string[]
  disallowedRules: string[]
  media: {
    images: ListingImage[]
    videoUrls: string[]
  }
  publicationStatus: "draft" | "published" | "hidden" | "archived"
  availabilityStatus: "available" | "occupied" | "renovating" | "paused"
  admin: {
    supplierPrice: number
    commissionType: "percentage" | "fixed"
    commissionValue: number
    specialCustomerPrice: number
    metaTitle: string
    metaDescription: string
  }
  internalNote: string
  hiddenReason: string
  isFeatured: boolean
  displayPriority: number
  createdAt: string
  updatedAt: string
}

export type AdminUnifiedListing = UnifiedListing & {
  source: "self_service" | "admin"
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  ownerVerified: boolean
  supplierName: string
  supplierCode: string
}

export type ListingSupplierOption = {
  id: string
  label: string
}
