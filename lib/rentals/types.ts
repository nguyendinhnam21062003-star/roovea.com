export type RentalType =
  | "boarding_room"
  | "mini_apartment"
  | "room_in_house"
  | "shared_room"
  | "dormitory"
  | "whole_house"
  | "other"

export type RentalPublicationStatus =
  | "draft"
  | "published"
  | "hidden"
  | "archived"

export type RentalAvailabilityStatus =
  | "available"
  | "occupied"
  | "renovating"
  | "paused"

export type RentalListingSource = "self_service" | "admin"

export type RentalImage = {
  id: string
  url: string
  caption: string
  isThumbnail: boolean
}

export type RentalMedia = {
  images: RentalImage[]
  videoUrls: string[]
}

export type RentalListing = {
  id: string
  code: string
  source: RentalListingSource
  ownerUserId?: string
  supplierId?: string
  name: string
  publicationStatus: RentalPublicationStatus
  availabilityStatus: RentalAvailabilityStatus
  rentalType: RentalType
  otherRentalType: string
  description: string
  monthlyPrice: number
  areaM2: number
  maxOccupants: number
  city: string
  newWard: string
  legacyWard: string
  legacyDistrict: string
  addressDetail: string
  googleMapsUrl: string
  nearbyPlaces: string[]
  electricityPrice: string
  waterPrice: string
  otherCosts: string
  amenities: string[]
  customAmenities: string[]
  allowedRules: string[]
  disallowedRules: string[]
  media: RentalMedia
  internalNote: string
  hiddenReason: string
  createdAt: string
  updatedAt: string
}

export type PublicRentalListing = RentalListing & {
  ownerVerified: boolean
}

export type RentalOwnerProfile = {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  phone: string
  zalo: string
  isVerified: boolean
  status: "active" | "suspended"
}

export type AdminRentalListing = RentalListing & {
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  ownerZalo: string
  ownerVerified: boolean
  supplierName: string
  supplierCode: string
}
