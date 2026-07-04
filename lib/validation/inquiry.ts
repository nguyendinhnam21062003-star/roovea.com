import { z } from "zod"

import { normalizeVietnamPhone, stripHtml, vietnamPhoneSchema } from "./shared"

export const inquirySourceSchema = z.enum([
  "chat_widget_home",
  "chat_widget_room",
  "contact_drawer",
  "other",
])

export const inquiryStatusSchema = z.enum([
  "new",
  "read",
  "contacted",
  "closed",
  "spam",
])

export const publicInquirySchema = z
  .object({
    customerName: z.string().trim().max(120).optional().default(""),
    email: z.string().trim().email().optional().or(z.literal("")).default(""),
    honeypot: z.string().optional().default(""),
    message: z
      .string()
      .trim()
      .max(2000, "Nội dung tối đa 2.000 ký tự.")
      .transform(stripHtml)
      .optional()
      .default(""),
    phone: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => (value ? normalizeVietnamPhone(value) : "")),
    routePath: z.string().trim().max(300).optional().default(""),
    roomCode: z.string().trim().max(32).optional().default(""),
    roomId: z.string().trim().max(120).optional().default(""),
    source: inquirySourceSchema,
    consent: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.honeypot) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Không thể gửi yêu cầu.",
        path: ["honeypot"],
      })
    }

    if (!value.phone && !value.message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập số điện thoại hoặc nội dung cần hỗ trợ.",
        path: ["message"],
      })
    }

    if (value.phone) {
      const phoneResult = vietnamPhoneSchema.safeParse(value.phone)

      if (!phoneResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Số điện thoại chưa đúng định dạng Việt Nam.",
          path: ["phone"],
        })
      }
    }
  })

export const updateInquirySchema = z.object({
  adminNote: z.string().trim().max(3000).optional(),
  status: inquiryStatusSchema.optional(),
})

export type PublicInquiryInput = z.infer<typeof publicInquirySchema>
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>
