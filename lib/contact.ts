export type ContactChannelType =
  "zalo" | "facebook" | "phone" | "whatsapp" | "email" | "custom"

export type ContactChannel = {
  id: string
  type: ContactChannelType
  label: string
  content: string
  href: string
  external: boolean
  enabled: boolean
  sortOrder: number
  logoSrc: string
  logoAlt: string
  appendRoomMessage: boolean
}

export const defaultContactChannels: ContactChannel[] = [
  {
    id: "contact-zalo",
    type: "zalo",
    label: "Nhắn tin qua Zalo",
    content: "0901 234 567",
    href: "https://zalo.me/84901234567",
    external: true,
    enabled: true,
    sortOrder: 0,
    logoSrc: "/contact/zalo-logo.png",
    logoAlt: "Zalo",
    appendRoomMessage: false,
  },
  {
    id: "contact-facebook",
    type: "facebook",
    label: "Nhắn tin qua Fanpage Facebook",
    content: "facebook.com/roovea",
    href: "https://facebook.com/roovea",
    external: true,
    enabled: true,
    sortOrder: 1,
    logoSrc: "/contact/facebook-logo.png",
    logoAlt: "Facebook",
    appendRoomMessage: false,
  },
  {
    id: "contact-phone",
    type: "phone",
    label: "Gọi điện",
    content: "0901 234 567",
    href: "tel:+84901234567",
    external: false,
    enabled: true,
    sortOrder: 2,
    logoSrc: "",
    logoAlt: "",
    appendRoomMessage: false,
  },
  {
    id: "contact-whatsapp",
    type: "whatsapp",
    label: "Nhắn tin qua WhatsApp",
    content: "0901 234 567",
    href: "https://wa.me/84901234567",
    external: true,
    enabled: true,
    sortOrder: 3,
    logoSrc: "",
    logoAlt: "",
    appendRoomMessage: true,
  },
  {
    id: "contact-email",
    type: "email",
    label: "Gửi email",
    content: "hello@roovea.com",
    href: "mailto:hello@roovea.com",
    external: false,
    enabled: true,
    sortOrder: 4,
    logoSrc: "",
    logoAlt: "",
    appendRoomMessage: false,
  },
]

export function getContactMessage(roomCode?: string) {
  return roomCode
    ? `Tôi muốn hỏi thêm về phòng mã ${roomCode} trên Roovea.`
    : "Tôi muốn được Roovea tư vấn nơi lưu trú phù hợp."
}

export function buildContactChannelHref(
  channel: ContactChannel,
  roomCode?: string
) {
  if (!channel.appendRoomMessage) {
    return channel.href
  }

  const separator = channel.href.includes("?") ? "&" : "?"

  return `${channel.href}${separator}text=${encodeURIComponent(
    getContactMessage(roomCode)
  )}`
}

export function getPrimaryContactChannels(channels: ContactChannel[]) {
  return channels
    .filter((channel) => channel.enabled)
    .sort((first, second) => first.sortOrder - second.sortOrder)
}
