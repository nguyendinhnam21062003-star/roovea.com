import "server-only"

import { and, desc, eq, ilike, or, sql } from "drizzle-orm"

import { db } from "@/db/client"
import { customerInquiries, rooms } from "@/db/schema"
import { makeId } from "@/lib/admin/helpers"
import {
  publicInquirySchema,
  updateInquirySchema,
  type InquiryStatus,
  type PublicInquiryInput,
} from "@/lib/validation/inquiry"
import {
  maskPhone,
  normalizeVietnamPhone,
  stripHtml,
} from "@/lib/validation/shared"

type InquiryRow = typeof customerInquiries.$inferSelect
type RoomRow = typeof rooms.$inferSelect

export type AdminInquiry = {
  id: string
  status: InquiryStatus
  source: PublicInquiryInput["source"]
  customerName: string
  phone: string
  phoneLast4: string
  maskedPhone: string
  email: string
  message: string
  routePath: string
  adminNote: string
  roomId: string
  roomCode: string
  roomName: string
  provinceCity: string
  createdAt: string
  updatedAt: string
  readAt: string
  contactedAt: string
  closedAt: string
}

type InquiryWithRoom = {
  inquiry: InquiryRow
  room: RoomRow | null
}

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

function toIso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : ""
}

function mapInquiry(row: InquiryWithRoom): AdminInquiry {
  const phone = row.inquiry.phone ?? ""

  return {
    id: row.inquiry.id,
    status: row.inquiry.status,
    source: row.inquiry.source,
    customerName: row.inquiry.customerName ?? "",
    phone,
    phoneLast4: row.inquiry.phoneLast4 ?? "",
    maskedPhone: phone ? maskPhone(phone) : "",
    email: row.inquiry.email ?? "",
    message: row.inquiry.message ?? "",
    routePath: row.inquiry.routePath ?? "",
    adminNote: row.inquiry.adminNote ?? "",
    roomId: row.inquiry.roomId ?? "",
    roomCode: row.room?.code ?? "",
    roomName: row.room?.name ?? "",
    provinceCity: row.room?.provinceCity ?? "",
    createdAt: toIso(row.inquiry.createdAt),
    updatedAt: toIso(row.inquiry.updatedAt),
    readAt: toIso(row.inquiry.readAt),
    contactedAt: toIso(row.inquiry.contactedAt),
    closedAt: toIso(row.inquiry.closedAt),
  }
}

export function checkInquiryRateLimit(key: string) {
  const now = Date.now()
  const current = rateLimitBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 })
    return true
  }

  if (current.count >= 5) {
    return false
  }

  current.count += 1
  return true
}

async function resolveInquiryRoom(input: PublicInquiryInput) {
  if (input.roomId) {
    const matched = await db
      .select()
      .from(rooms)
      .where(
        and(eq(rooms.stayType, "short_stay"), eq(rooms.id, input.roomId))
      )
      .limit(1)

    return matched[0]?.id ?? null
  }

  if (!input.roomCode) {
    return null
  }

  const code = input.roomCode.startsWith("PH-")
    ? input.roomCode
    : `PH-${input.roomCode}`
  const matched = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.stayType, "short_stay"), eq(rooms.code, code)))
    .limit(1)

  return matched[0]?.id ?? null
}

export async function createCustomerInquiry(input: unknown) {
  const parsed = publicInquirySchema.parse(input)
  const roomId = await resolveInquiryRoom(parsed)
  const phone = parsed.phone ? normalizeVietnamPhone(parsed.phone) : ""
  const now = new Date()
  const values = {
    id: makeId("inquiry"),
    status: "new" as const,
    source: parsed.source,
    roomId,
    customerName: stripHtml(parsed.customerName),
    phone: phone || null,
    phoneLast4: phone ? phone.slice(-4) : null,
    email: parsed.email || null,
    message: stripHtml(parsed.message),
    routePath: parsed.routePath || null,
    consentAt: parsed.consent ? now : null,
    updatedAt: now,
  }

  await db.insert(customerInquiries).values(values)

  return { id: values.id }
}

export async function listAdminInquiries(filters?: {
  query?: string
  source?: string
  status?: string
}) {
  const conditions = []

  if (filters?.status && filters.status !== "all") {
    conditions.push(
      eq(customerInquiries.status, filters.status as InquiryStatus)
    )
  }

  if (filters?.source && filters.source !== "all") {
    conditions.push(
      eq(
        customerInquiries.source,
        filters.source as PublicInquiryInput["source"]
      )
    )
  }

  if (filters?.query?.trim()) {
    const query = `%${filters.query.trim()}%`
    conditions.push(
      or(
        ilike(customerInquiries.customerName, query),
        ilike(customerInquiries.phone, query),
        ilike(customerInquiries.email, query),
        ilike(customerInquiries.message, query),
        ilike(rooms.code, query),
        ilike(rooms.name, query)
      )
    )
  }

  const rows = await db
    .select({ inquiry: customerInquiries, room: rooms })
    .from(customerInquiries)
    .leftJoin(rooms, eq(customerInquiries.roomId, rooms.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customerInquiries.createdAt))
    .limit(150)

  return rows.map(mapInquiry)
}

export async function getUnreadInquiryCount() {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customerInquiries)
    .where(eq(customerInquiries.status, "new"))

  return rows[0]?.count ?? 0
}

export async function updateAdminInquiry(id: string, input: unknown) {
  const parsed = updateInquirySchema.parse(input)
  const patch: Partial<typeof customerInquiries.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (parsed.adminNote !== undefined) {
    patch.adminNote = stripHtml(parsed.adminNote)
  }

  if (parsed.status) {
    patch.status = parsed.status

    if (parsed.status === "read") {
      patch.readAt = new Date()
    }

    if (parsed.status === "contacted") {
      patch.readAt = new Date()
      patch.contactedAt = new Date()
    }

    if (parsed.status === "closed") {
      patch.closedAt = new Date()
    }
  }

  await db
    .update(customerInquiries)
    .set(patch)
    .where(eq(customerInquiries.id, id))

  const rows = await db
    .select({ inquiry: customerInquiries, room: rooms })
    .from(customerInquiries)
    .leftJoin(rooms, eq(customerInquiries.roomId, rooms.id))
    .where(eq(customerInquiries.id, id))
    .limit(1)

  return rows[0] ? mapInquiry(rows[0]) : null
}
