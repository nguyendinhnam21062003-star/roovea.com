import type {
  AccommodationType,
  DistanceToCenter,
  Gender,
  PriceUnit,
  RoomStatus,
  ServiceType,
  SupplierStatus,
  Weekday,
} from "@/lib/admin/types"

export const roomStatusLabels: Record<RoomStatus, string> = {
  draft: "Nháp",
  pending_completion: "Chờ bổ sung thông tin",
  published: "Đã đăng",
  hidden: "Tạm ẩn",
  discontinued: "Ngừng hợp tác",
}

export const supplierStatusLabels: Record<SupplierStatus, string> = {
  active: "Đang hợp tác",
  paused: "Tạm ngưng",
  discontinued: "Ngừng hợp tác",
}

export const accommodationTypeLabels: Record<AccommodationType, string> = {
  mini_apartment: "Chung cư mini",
  boarding_room: "Phòng trọ",
  dormitory: "Ký túc xá",
  room_in_house: "Phòng trong nhà",
  shared_room: "Ở ghép",
  guesthouse: "Nhà nghỉ",
  hotel: "Khách sạn",
  apartment: "Chung cư",
  whole_house: "Nhà nguyên căn",
  cruise: "Du thuyền",
  villa: "Biệt thự/Villa",
  resort: "Resort",
  homestay: "Homestay",
  studio: "Khác",
  other: "Khác",
}

export const priceUnitLabels: Record<PriceUnit, string> = {
  per_night: "Theo đêm",
  per_hour: "Theo giờ",
}

export const weekdayLabels: Record<Weekday, string> = {
  monday: "Thứ 2",
  tuesday: "Thứ 3",
  wednesday: "Thứ 4",
  thursday: "Thứ 5",
  friday: "Thứ 6",
  saturday: "Thứ 7",
  sunday: "Chủ nhật",
}

export const defaultWeekdayDays: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
]

export const distanceToCenterLabels: Record<DistanceToCenter, string> = {
  under_3km: "Dưới 3 km",
  from_3_to_5km: "Từ 3 đến 5 km",
  over_5km: "Trên 5 km",
  not_declared: "Không khai báo",
}

export const genderLabels: Record<Gender, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
  prefer_not_to_say: "Không muốn khai báo",
}

export const serviceTypeLabels: Record<ServiceType, string> = {
  accommodation: "Lưu trú",
  tour: "Tour du lịch",
  flight_ticket: "Vé máy bay",
  transfer: "Xe đưa đón",
  guide: "Hướng dẫn viên",
  vehicle_rental: "Thuê xe",
}

export const roomStatusOptions = Object.entries(roomStatusLabels).map(
  ([value, label]) => ({ value: value as RoomStatus, label })
)

export const supplierStatusOptions = Object.entries(supplierStatusLabels).map(
  ([value, label]) => ({ value: value as SupplierStatus, label })
)

export const accommodationTypeOptions = [
  "homestay",
  "whole_house",
  "apartment",
  "guesthouse",
  "hotel",
  "villa",
  "cruise",
  "resort",
  "other",
].map((value) => ({
  value: value as AccommodationType,
  label: accommodationTypeLabels[value as AccommodationType],
}))

export const priceUnitOptions = Object.entries(priceUnitLabels).map(
  ([value, label]) => ({ value: value as PriceUnit, label })
)

export const weekdayOptions = Object.entries(weekdayLabels).map(
  ([value, label]) => ({ value: value as Weekday, label })
)

export const distanceToCenterOptions = Object.entries(
  distanceToCenterLabels
).map(([value, label]) => ({ value: value as DistanceToCenter, label }))

export const genderOptions = Object.entries(genderLabels).map(
  ([value, label]) => ({ value: value as Gender, label })
)

export const serviceTypeOptions = Object.entries(serviceTypeLabels).map(
  ([value, label]) => ({ value: value as ServiceType, label })
)

export const provinceOptions = [
  {
    value: "Quảng Ninh",
    districts: ["Thành phố Hạ Long", "Cẩm Phả", "Vân Đồn"],
  },
  {
    value: "Đà Nẵng",
    districts: ["Sơn Trà", "Ngũ Hành Sơn", "Hải Châu"],
  },
  {
    value: "Hà Nội",
    districts: ["Hoàn Kiếm", "Ba Đình", "Tây Hồ"],
  },
  {
    value: "TP. Hồ Chí Minh",
    districts: ["Quận 1", "Thành phố Thủ Đức", "Quận 7"],
  },
  {
    value: "Lâm Đồng",
    districts: ["Đà Lạt", "Bảo Lộc"],
  },
  {
    value: "Kiên Giang",
    districts: ["Phú Quốc", "Rạch Giá"],
  },
  {
    value: "Quảng Nam",
    districts: ["Hội An", "Tam Kỳ"],
  },
  {
    value: "Khánh Hòa",
    districts: ["Nha Trang", "Cam Ranh"],
  },
]

export const nearbyTagOptions = [
  { value: "near_beach", label: "Gần biển" },
  { value: "near_center", label: "Gần trung tâm" },
  { value: "near_airport", label: "Gần sân bay" },
  { value: "near_bus_station", label: "Gần bến xe" },
  { value: "near_attraction", label: "Gần khu du lịch" },
  { value: "near_market", label: "Gần chợ" },
  { value: "other", label: "Khác" },
]

export function getNearbyTagLabel(value: string) {
  return nearbyTagOptions.find((item) => item.value === value)?.label ?? value
}
