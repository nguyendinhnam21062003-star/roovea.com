export const contactConfig = {
  email: "hello@roovea.com",
  fanpageLabel: "facebook.com/roovea",
  fanpageUrl: "https://facebook.com/roovea",
  phone: "0901 234 567",
  phoneHref: "tel:+84901234567",
  whatsappBaseUrl: "https://wa.me/84901234567",
  zaloLabel: "zalo.me/84901234567",
  zaloUrl: "https://zalo.me/84901234567",
}

export function getContactMessage(roomCode?: string) {
  return roomCode
    ? `Tôi muốn hỏi thêm về phòng mã ${roomCode} trên Roovea.`
    : "Tôi muốn được Roovea tư vấn nơi lưu trú phù hợp."
}

export function getWhatsappHref(roomCode?: string) {
  return `${contactConfig.whatsappBaseUrl}?text=${encodeURIComponent(
    getContactMessage(roomCode)
  )}`
}
