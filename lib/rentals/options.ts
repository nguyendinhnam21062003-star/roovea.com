import type {
  RentalAvailabilityStatus,
  RentalPublicationStatus,
  RentalType,
} from "@/lib/rentals/types"

export const rentalTypeLabels: Record<RentalType, string> = {
  boarding_room: "Phòng trọ",
  mini_apartment: "Căn hộ mini",
  room_in_house: "Phòng trong nhà/chung cư",
  shared_room: "Ở ghép",
  dormitory: "Ký túc xá",
  whole_house: "Nhà nguyên căn",
  other: "Khác",
}

export const rentalTypeOptions = Object.entries(rentalTypeLabels).map(
  ([value, label]) => ({ value: value as RentalType, label })
)

export const rentalPublicationStatusLabels: Record<
  RentalPublicationStatus,
  string
> = {
  draft: "Bản nháp",
  published: "Đã xuất bản",
  hidden: "Đã bị ẩn",
  archived: "Đã lưu trữ",
}

export const rentalAvailabilityStatusLabels: Record<
  RentalAvailabilityStatus,
  string
> = {
  available: "Còn phòng",
  occupied: "Hết phòng",
  renovating: "Đang sửa",
  paused: "Tạm ngừng",
}

export const rentalAvailabilityOptions = Object.entries(
  rentalAvailabilityStatusLabels
).map(([value, label]) => ({
  value: value as RentalAvailabilityStatus,
  label,
}))

export const rentalAmenityOptions = [
  { value: "air_conditioner", label: "Có điều hòa" },
  { value: "water_heater", label: "Có nóng lạnh" },
  { value: "bed", label: "Có giường" },
  { value: "wardrobe", label: "Có tủ quần áo" },
  { value: "desk", label: "Có bàn học" },
  { value: "kitchen", label: "Có bếp" },
  { value: "washing_machine", label: "Có máy giặt" },
  { value: "refrigerator", label: "Có tủ lạnh" },
  { value: "balcony", label: "Có ban công" },
  { value: "window", label: "Có cửa sổ" },
  { value: "private_toilet", label: "Có WC riêng" },
  { value: "mezzanine", label: "Có gác lửng" },
  { value: "elevator", label: "Có thang máy" },
] as const

export function getRentalAmenityLabel(value: string) {
  return (
    rentalAmenityOptions.find((option) => option.value === value)?.label ?? value
  )
}

export function getRentalTypeLabel(type: RentalType, otherType?: string) {
  return type === "other" && otherType?.trim()
    ? otherType.trim()
    : rentalTypeLabels[type]
}
