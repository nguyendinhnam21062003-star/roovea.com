export type RoomMedia = {
  type: "image" | "video"
  src: string
  alt: string
  thumbnail?: string
}

export type RoomProvider = {
  name: string
  contacts: string[]
}

type RoomInput = {
  slug: string
  code: string
  name: string
  entryPrice: number
  commissionRate: number
  referencePrice: number
  strikePrice: number
  media: RoomMedia[]
  description: string
  locationLevel1: string
  locationLevel2: string
  address: string
  googleMapUrl: string
  provider: RoomProvider
  updatedAt: string
  featured?: boolean
  bedrooms: number
  guests: number
  area: string
  highlights: string[]
  amenities: string[]
}

export type Room = RoomInput & {
  expectedProfit: number
}

export type PublicRoom = Pick<
  Room,
  | "slug"
  | "code"
  | "name"
  | "referencePrice"
  | "strikePrice"
  | "media"
  | "description"
  | "locationLevel1"
  | "locationLevel2"
  | "address"
  | "googleMapUrl"
  | "updatedAt"
  | "featured"
  | "bedrooms"
  | "guests"
  | "area"
  | "highlights"
  | "amenities"
>

const roomInputs: RoomInput[] = [
  {
    slug: "can-ho-view-bien-my-khe",
    code: "48219",
    name: "Căn hộ view biển Mỹ Khê",
    entryPrice: 1150000,
    commissionRate: 0.12,
    referencePrice: 1450000,
    strikePrice: 1800000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
        alt: "Khách sạn gần biển với hồ bơi ngoài trời",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
        alt: "Phòng ngủ khách sạn sáng sủa",
      },
    ],
    description:
      "Căn hộ một phòng ngủ gần bãi Mỹ Khê, phù hợp khách đi nghỉ ngắn ngày hoặc cặp đôi muốn ở khu vực tiện di chuyển. Phòng có ban công, bếp nhỏ và khu làm việc gọn.",
    locationLevel1: "Đà Nẵng",
    locationLevel2: "Sơn Trà",
    address: "Võ Nguyên Giáp, phường Phước Mỹ, quận Sơn Trà",
    googleMapUrl: "https://maps.google.com/?q=My+Khe+Beach+Da+Nang",
    provider: {
      name: "Nguyễn Minh Anh",
      contacts: ["0901 111 222", "minhanh.rooms@example.com"],
    },
    updatedAt: "2026-06-25",
    featured: true,
    bedrooms: 1,
    guests: 2,
    area: "45 m2",
    highlights: ["Gần biển", "Ban công", "Bếp nhỏ"],
    amenities: ["Wifi", "Máy lạnh", "Máy giặt", "Bãi đỗ xe"],
  },
  {
    slug: "villa-ho-boi-an-bang",
    code: "73054",
    name: "Villa hồ bơi An Bàng",
    entryPrice: 3100000,
    commissionRate: 0.1,
    referencePrice: 3950000,
    strikePrice: 4600000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
        alt: "Villa hiện đại có hồ bơi riêng",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80",
        alt: "Không gian phòng khách trong villa",
      },
      {
        type: "video",
        src: "https://www.youtube.com/embed/ysz5S6PUM-U",
        alt: "Video giới thiệu villa mẫu",
      },
    ],
    description:
      "Villa riêng tư gần biển An Bàng, có hồ bơi, bếp đầy đủ và sân nhỏ cho nhóm bạn hoặc gia đình. Không gian yên tĩnh, phù hợp lịch trình Hội An kết hợp nghỉ dưỡng.",
    locationLevel1: "Quảng Nam",
    locationLevel2: "Hội An",
    address: "Khu An Bàng, phường Cẩm An, thành phố Hội An",
    googleMapUrl: "https://maps.google.com/?q=An+Bang+Beach+Hoi+An",
    provider: {
      name: "Lê Hoàng Phúc",
      contacts: ["0933 555 777", "phuc.villa@example.com"],
    },
    updatedAt: "2026-06-28",
    featured: true,
    bedrooms: 3,
    guests: 6,
    area: "180 m2",
    highlights: ["Hồ bơi riêng", "Gần biển", "Phù hợp gia đình"],
    amenities: ["Wifi", "Bếp", "BBQ", "Dọn phòng"],
  },
  {
    slug: "studio-trung-tam-da-lat",
    code: "19586",
    name: "Studio trung tâm Đà Lạt",
    entryPrice: 720000,
    commissionRate: 0.15,
    referencePrice: 980000,
    strikePrice: 1250000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        alt: "Studio nghỉ dưỡng ấm cúng",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
        alt: "Phòng ngủ nhỏ với ánh sáng tự nhiên",
      },
    ],
    description:
      "Studio gọn trong khu trung tâm, đi bộ thuận tiện đến chợ đêm và các quán cà phê. Phòng phù hợp khách solo, cặp đôi hoặc chuyến công tác ngắn.",
    locationLevel1: "Lâm Đồng",
    locationLevel2: "Đà Lạt",
    address: "Đường Nguyễn Chí Thanh, phường 1, thành phố Đà Lạt",
    googleMapUrl: "https://maps.google.com/?q=Da+Lat+Market",
    provider: {
      name: "Trần Bảo Ngọc",
      contacts: ["0977 100 200", "baongoc.stay@example.com"],
    },
    updatedAt: "2026-06-20",
    featured: false,
    bedrooms: 1,
    guests: 2,
    area: "32 m2",
    highlights: ["Trung tâm", "Có bếp", "View phố"],
    amenities: ["Wifi", "Bếp nhỏ", "Máy sấy", "Nước nóng"],
  },
  {
    slug: "penthouse-song-sai-gon",
    code: "86402",
    name: "Penthouse sông Sài Gòn",
    entryPrice: 4200000,
    commissionRate: 0.08,
    referencePrice: 5200000,
    strikePrice: 6200000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80",
        alt: "Căn hộ cao cấp với cửa kính lớn",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
        alt: "Phòng khách căn hộ cao cấp",
      },
    ],
    description:
      "Penthouse tầng cao có tầm nhìn về sông, phòng khách rộng và bếp mở. Phù hợp khách cần không gian riêng tư, tiếp khách nhẹ hoặc kỳ nghỉ cuối tuần trong thành phố.",
    locationLevel1: "TP. Hồ Chí Minh",
    locationLevel2: "Quận 2",
    address: "Khu Thảo Điền, thành phố Thủ Đức",
    googleMapUrl: "https://maps.google.com/?q=Thao+Dien+Ho+Chi+Minh",
    provider: {
      name: "Phạm Quốc Bảo",
      contacts: ["0918 222 333", "quocbao.penthouse@example.com"],
    },
    updatedAt: "2026-06-29",
    featured: true,
    bedrooms: 2,
    guests: 4,
    area: "120 m2",
    highlights: ["View sông", "Tầng cao", "Bếp mở"],
    amenities: ["Wifi", "Hồ bơi tòa nhà", "Gym", "Bãi đỗ xe"],
  },
  {
    slug: "bungalow-bai-sao-phu-quoc",
    code: "52741",
    name: "Bungalow Bãi Sao Phú Quốc",
    entryPrice: 1650000,
    commissionRate: 0.11,
    referencePrice: 2150000,
    strikePrice: 2600000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
        alt: "Khu nghỉ dưỡng nhiệt đới có hồ bơi",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80",
        alt: "Phòng nghỉ resort với giường lớn",
      },
    ],
    description:
      "Bungalow trong khu vườn yên tĩnh, cách biển một quãng ngắn. Phòng hợp khách muốn nghỉ dưỡng nhẹ nhàng, có hiên ngồi và dịch vụ đưa đón theo yêu cầu.",
    locationLevel1: "Kiên Giang",
    locationLevel2: "Phú Quốc",
    address: "Khu Bãi Sao, phường An Thới, Phú Quốc",
    googleMapUrl: "https://maps.google.com/?q=Bai+Sao+Phu+Quoc",
    provider: {
      name: "Đỗ Thảo Vy",
      contacts: ["0908 888 999", "thaovy.bungalow@example.com"],
    },
    updatedAt: "2026-06-24",
    featured: false,
    bedrooms: 1,
    guests: 3,
    area: "52 m2",
    highlights: ["Không gian vườn", "Gần biển", "Hiên riêng"],
    amenities: ["Wifi", "Ăn sáng", "Đưa đón", "Dọn phòng"],
  },
  {
    slug: "homestay-pho-co-ha-noi",
    code: "31867",
    name: "Homestay phố cổ Hà Nội",
    entryPrice: 890000,
    commissionRate: 0.14,
    referencePrice: 1180000,
    strikePrice: 1500000,
    media: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80",
        alt: "Căn hộ homestay hiện đại",
      },
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=80",
        alt: "Không gian nghỉ có sofa và bàn nhỏ",
      },
    ],
    description:
      "Homestay trong khu phố cổ, thuận tiện đi bộ đến hồ Hoàn Kiếm và các tuyến ẩm thực. Phòng có phong cách tối giản, phù hợp khách thích lịch trình khám phá thành phố.",
    locationLevel1: "Hà Nội",
    locationLevel2: "Hoàn Kiếm",
    address: "Phố Hàng Bạc, quận Hoàn Kiếm",
    googleMapUrl: "https://maps.google.com/?q=Hoan+Kiem+Lake+Hanoi",
    provider: {
      name: "Vũ Khánh Linh",
      contacts: ["0986 321 654", "khanhlinh.home@example.com"],
    },
    updatedAt: "2026-06-21",
    featured: false,
    bedrooms: 1,
    guests: 2,
    area: "38 m2",
    highlights: ["Phố cổ", "Đi bộ thuận tiện", "Tối giản"],
    amenities: ["Wifi", "Máy lạnh", "Bếp nhỏ", "Tự check-in"],
  },
]

export const rooms: Room[] = roomInputs.map((room) => ({
  ...room,
  expectedProfit:
    room.referencePrice +
    room.commissionRate * room.entryPrice -
    room.entryPrice,
}))

export function toPublicRoom(room: Room): PublicRoom {
  const {
    slug,
    code,
    name,
    referencePrice,
    strikePrice,
    media,
    description,
    locationLevel1,
    locationLevel2,
    address,
    googleMapUrl,
    updatedAt,
    featured,
    bedrooms,
    guests,
    area,
    highlights,
    amenities,
  } = room

  return {
    slug,
    code,
    name,
    referencePrice,
    strikePrice,
    media,
    description,
    locationLevel1,
    locationLevel2,
    address,
    googleMapUrl,
    updatedAt,
    featured,
    bedrooms,
    guests,
    area,
    highlights,
    amenities,
  }
}

export function getPublicRooms() {
  return rooms.map(toPublicRoom)
}

export function getPublicRoomBySlug(slug: string) {
  const room = rooms.find((item) => item.slug === slug)

  return room ? toPublicRoom(room) : null
}

export function getFeaturedRooms() {
  return getPublicRooms().filter((room) => room.featured)
}
