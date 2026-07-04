import { z } from "zod"

export function normalizeVietnamPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "")

  if (compact.startsWith("+84")) {
    return `0${compact.slice(3)}`
  }

  if (compact.startsWith("84")) {
    return `0${compact.slice(2)}`
  }

  return compact
}

export const vietnamPhoneSchema = z
  .string()
  .trim()
  .transform(normalizeVietnamPhone)
  .refine((value) => /^0\d{8,10}$/.test(value), {
    message: "Số điện thoại chưa đúng định dạng Việt Nam.",
  })

export const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? "")
  .refine(
    (value) => {
      if (!value) {
        return true
      }

      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    { message: "URL không hợp lệ." }
  )

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim()
}

export function maskPhone(value: string) {
  const normalized = normalizeVietnamPhone(value)

  if (normalized.length < 7) {
    return normalized
  }

  return `${normalized.slice(0, 4)}${"•".repeat(
    Math.max(2, normalized.length - 7)
  )}${normalized.slice(-3)}`
}
