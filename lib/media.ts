import type { RoomMedia } from "@/lib/rooms"

const fallbackRoomImage: RoomMedia = {
  type: "image",
  src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  alt: "Không gian lưu trú Roovea",
}

export function getPrimaryRoomMedia(media: RoomMedia[]): RoomMedia {
  return (
    media.find((item) => item.type === "image") ?? media[0] ?? fallbackRoomImage
  )
}
