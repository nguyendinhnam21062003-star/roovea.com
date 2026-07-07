export type RoomStatus =
  "draft" | "pending_completion" | "published" | "hidden" | "discontinued"

export type SupplierStatus = "active" | "paused" | "discontinued"

export type AccommodationType =
  | "guesthouse"
  | "hotel"
  | "apartment"
  | "whole_house"
  | "cruise"
  | "villa"
  | "resort"
  | "homestay"
  | "studio"
  | "other"

export type CommissionType = "percentage" | "fixed"

export type PriceUnit = "per_night" | "per_hour"

export type DistanceToCenter =
  "under_3km" | "from_3_to_5km" | "over_5km" | "not_declared"

export type SmokingPolicy = "allowed" | "not_allowed" | "designated_area"

export type PetsPolicy = "allowed" | "not_allowed" | "conditional"

export type CancellationPolicy =
  "not_allowed" | "free_cancellation" | "conditional"

export type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export type ServiceType =
  | "accommodation"
  | "tour"
  | "flight_ticket"
  | "transfer"
  | "guide"
  | "vehicle_rental"

export type ServiceArea = {
  id: string
  country: string
  provinceCity: string
  districtCity: string
}

export type RoomImage = {
  id: string
  url: string
  caption: string
  isThumbnail: boolean
  warning?: string
}

export type RoomMedia = {
  images: RoomImage[]
  videoUrls: string[]
}

export type RoomPricing = {
  supplierPrice: number
  commissionType: CommissionType
  commissionValue: number
  referencePrice: number
  strikethroughPrice?: number
  priceUnit: PriceUnit
  priceNote: string
}

export type RoomLocation = {
  provinceCity: string
  districtCity: string
  addressDetail: string
  googleMapsUrl: string
  nearbyTags: string[]
  distanceToCenter: DistanceToCenter
}

export type RoomPolicies = {
  checkInTime: string
  checkOutTime: string
  smoking: SmokingPolicy
  pets: PetsPolicy
  cancellationType: CancellationPolicy
  cancellationDetail: string
  depositRequired: boolean
  depositDetail: string
  minimumNights: number
  quietHours: string
  otherPolicy: string
}

export type RoomSeo = {
  slug: string
  metaTitle: string
  metaDescription: string
  shareThumbnailImageId?: string
}

export type RoomCapacity = {
  maxGuests: number
  bedrooms: number
  bathrooms: number
  beds: number
}

export type Room = {
  id: string
  roomCode: string
  name: string
  status: RoomStatus
  accommodationTypes: AccommodationType[]
  otherAccommodationType: string
  description: string
  areaM2?: number
  capacity: RoomCapacity
  supplierId?: string
  pricing: RoomPricing
  location: RoomLocation
  policies: RoomPolicies
  amenities: string[]
  customAmenities: string[]
  media: RoomMedia
  seo: RoomSeo
  isFeatured: boolean
  displayPriority: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export type Supplier = {
  id: string
  supplierCode: string
  fullName: string
  citizenId: string
  citizenIdMasked?: string
  age?: number
  gender: Gender
  address: string
  phone: string
  zalo: string
  facebookUrl: string
  tiktokUrl: string
  email: string
  serviceAreas: ServiceArea[]
  serviceTypes: ServiceType[]
  accommodationTypes: AccommodationType[]
  status: SupplierStatus
  internalNote: string
  createdAt: string
  updatedAt: string
}

export type CompletionSection =
  "basic" | "supplier" | "pricing" | "location" | "media" | "policies"

export type RoomCompletion = {
  percent: number
  sections: Record<CompletionSection, boolean>
  missing: string[]
}
