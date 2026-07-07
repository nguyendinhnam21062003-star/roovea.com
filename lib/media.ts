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

function getYoutubeVideoId(url: URL) {
  const host = url.hostname.replace(/^www\./, "")

  if (host === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null
  }

  if (host !== "youtube.com" && !host.endsWith(".youtube.com")) {
    return null
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v")
  }

  const [, type, id] = url.pathname.split("/")

  if (type === "shorts") {
    return id ?? null
  }

  return null
}

function getVimeoVideoId(url: URL) {
  const host = url.hostname.replace(/^www\./, "")
  const segments = url.pathname.split("/").filter(Boolean)

  if (host === "vimeo.com" && segments.length === 1) {
    return /^\d+$/.test(segments[0]) ? segments[0] : null
  }

  return null
}

export function getVideoEmbedUrl(src: string): string | null {
  try {
    const url = new URL(src)
    const host = url.hostname.replace(/^www\./, "")
    const segments = url.pathname.split("/").filter(Boolean)

    if (
      (host === "youtube.com" || host.endsWith(".youtube.com")) &&
      segments[0] === "embed" &&
      segments[1]
    ) {
      return url.toString()
    }

    const youtubeId = getYoutubeVideoId(url)
    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}`
    }

    if (
      host === "player.vimeo.com" &&
      segments[0] === "video" &&
      segments[1]
    ) {
      return url.toString()
    }

    const vimeoId = getVimeoVideoId(url)
    return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null
  } catch {
    return null
  }
}
