import type {
  AccommodationType,
  BedType,
  CancellationPolicy,
  DistanceToCenter,
  Gender,
  PetsPolicy,
  PriceUnit,
  RoomStatus,
  ServiceType,
  SmokingPolicy,
  SpaceType,
  SupplierStatus,
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
  guesthouse: "Nhà nghỉ",
  hotel: "Khách sạn",
  apartment: "Căn hộ/Chung cư",
  whole_house: "Nhà nguyên căn",
  cruise: "Du thuyền",
  villa: "Villa",
  homestay: "Homestay",
  studio: "Studio",
  other: "Khác",
}

export const spaceTypeLabels: Record<SpaceType, string> = {
  entire_place: "Toàn bộ chỗ ở",
  private_room: "Phòng riêng",
  shared_room: "Phòng dùng chung",
}

export const bedTypeLabels: Record<BedType, string> = {
  single_bed: "Giường đơn",
  double_bed: "Giường đôi",
  king_bed: "Giường king",
  sofa_bed: "Sofa bed",
  other: "Khác",
}

export const priceUnitLabels: Record<PriceUnit, string> = {
  per_night: "Theo đêm",
  per_hour: "Theo giờ",
}

export const distanceToCenterLabels: Record<DistanceToCenter, string> = {
  under_3km: "Dưới 3 km",
  from_3_to_5km: "Từ 3 đến 5 km",
  over_5km: "Trên 5 km",
  not_declared: "Không khai báo",
}

export const smokingPolicyLabels: Record<SmokingPolicy, string> = {
  allowed: "Cho phép",
  not_allowed: "Không cho phép",
  designated_area: "Có khu vực riêng",
}

export const petsPolicyLabels: Record<PetsPolicy, string> = {
  allowed: "Cho phép",
  not_allowed: "Không cho phép",
  conditional: "Cho phép có điều kiện",
}

export const cancellationPolicyLabels: Record<CancellationPolicy, string> = {
  not_allowed: "Không cho phép hủy",
  free_cancellation: "Cho phép hủy miễn phí",
  conditional: "Cho phép hủy có điều kiện",
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

export const accommodationTypeOptions = Object.entries(
  accommodationTypeLabels
).map(([value, label]) => ({ value: value as AccommodationType, label }))

export const spaceTypeOptions = Object.entries(spaceTypeLabels).map(
  ([value, label]) => ({ value: value as SpaceType, label })
)

export const bedTypeOptions = Object.entries(bedTypeLabels).map(
  ([value, label]) => ({ value: value as BedType, label })
)

export const priceUnitOptions = Object.entries(priceUnitLabels).map(
  ([value, label]) => ({ value: value as PriceUnit, label })
)

export const distanceToCenterOptions = Object.entries(
  distanceToCenterLabels
).map(([value, label]) => ({ value: value as DistanceToCenter, label }))

export const smokingPolicyOptions = Object.entries(smokingPolicyLabels).map(
  ([value, label]) => ({ value: value as SmokingPolicy, label })
)

export const petsPolicyOptions = Object.entries(petsPolicyLabels).map(
  ([value, label]) => ({ value: value as PetsPolicy, label })
)

export const cancellationPolicyOptions = Object.entries(
  cancellationPolicyLabels
).map(([value, label]) => ({ value: value as CancellationPolicy, label }))

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

export const amenityGroups = [
  {
    title: "Tiện nghi cơ bản",
    options: [
      { value: "free_wifi", label: "Wifi miễn phí" },
      { value: "air_conditioning", label: "Máy lạnh" },
      { value: "hot_water", label: "Nước nóng" },
      { value: "tv", label: "TV" },
      { value: "fridge", label: "Tủ lạnh" },
      { value: "hair_dryer", label: "Máy sấy tóc" },
      { value: "desk", label: "Bàn làm việc" },
      { value: "balcony", label: "Ban công" },
      { value: "kitchen", label: "Bếp" },
      { value: "washing_machine", label: "Máy giặt" },
      { value: "elevator", label: "Thang máy" },
    ],
  },
  {
    title: "Dịch vụ",
    options: [
      { value: "free_parking", label: "Bãi đỗ xe miễn phí" },
      { value: "paid_parking", label: "Bãi đỗ xe trả phí" },
      { value: "breakfast", label: "Bữa sáng" },
      { value: "lunch", label: "Bữa trưa" },
      { value: "dinner", label: "Bữa tối" },
      { value: "pool", label: "Hồ bơi" },
      { value: "laundry", label: "Dịch vụ giặt sấy" },
      { value: "shoe_cleaning", label: "Vệ sinh giày dép" },
      { value: "electric_cart", label: "Xe điện đưa đón" },
      { value: "front_desk", label: "Lễ tân" },
      { value: "cleaning", label: "Dọn phòng" },
      { value: "motorbike_rental", label: "Thuê xe máy" },
      { value: "airport_pickup", label: "Đưa đón sân bay" },
    ],
  },
  {
    title: "Không gian và vị trí",
    options: [
      { value: "center_area", label: "Gần trung tâm" },
      { value: "beach_area", label: "Gần biển" },
      { value: "sea_view", label: "View biển" },
      { value: "mountain_view", label: "View núi" },
      { value: "city_view", label: "View thành phố" },
      { value: "quiet_area", label: "Khu vực yên tĩnh" },
      { value: "family_friendly", label: "Phù hợp gia đình" },
      { value: "group_friendly", label: "Phù hợp nhóm bạn" },
      { value: "remote_work", label: "Phù hợp làm việc từ xa" },
    ],
  },
]

export function getAmenityLabel(value: string) {
  for (const group of amenityGroups) {
    const option = group.options.find((item) => item.value === value)

    if (option) {
      return option.label
    }
  }

  return value
}

export function getNearbyTagLabel(value: string) {
  return nearbyTagOptions.find((item) => item.value === value)?.label ?? value
}
