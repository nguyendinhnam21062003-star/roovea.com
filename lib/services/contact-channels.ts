import "server-only"

import { asc } from "drizzle-orm"

import { db } from "@/db/client"
import { auditLogs, contactChannels } from "@/db/schema"
import { makeId } from "@/lib/admin/helpers"
import {
  defaultContactChannels,
  type ContactChannel,
  type ContactChannelType,
} from "@/lib/contact"
import { contactChannelsSchema } from "@/lib/validation/admin"
import { stripHtml } from "@/lib/validation/shared"

type ContactChannelRow = typeof contactChannels.$inferSelect

function contactChannelToPublic(row: ContactChannelRow): ContactChannel {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    content: row.content,
    href: row.href,
    external: row.external,
    enabled: row.enabled,
    sortOrder: row.sortOrder,
    logoSrc: row.logoSrc,
    logoAlt: row.logoAlt,
    appendRoomMessage: row.appendRoomMessage,
  }
}

function normalizeContactChannel(
  channel: ContactChannel,
  index: number
): ContactChannel {
  return {
    id: channel.id || makeId("contact"),
    type: channel.type as ContactChannelType,
    label: stripHtml(channel.label).trim(),
    content: stripHtml(channel.content).trim(),
    href: channel.href.trim(),
    external: channel.external,
    enabled: channel.enabled,
    sortOrder: index,
    logoSrc: channel.logoSrc.trim(),
    logoAlt: stripHtml(channel.logoAlt).trim(),
    appendRoomMessage: channel.appendRoomMessage,
  }
}

export async function listContactChannels() {
  const rows = await db
    .select()
    .from(contactChannels)
    .orderBy(asc(contactChannels.sortOrder), asc(contactChannels.createdAt))

  return rows.map(contactChannelToPublic)
}

export async function getPublicContactChannels() {
  try {
    const channels = await listContactChannels()

    return channels.length > 0 ? channels : defaultContactChannels
  } catch {
    return defaultContactChannels
  }
}

export async function replaceContactChannels(
  input: unknown,
  actorEmail: string
) {
  const parsed = contactChannelsSchema.parse(input)
  const channels = parsed.map(normalizeContactChannel)
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx.delete(contactChannels)

    if (channels.length > 0) {
      await tx.insert(contactChannels).values(
        channels.map((channel) => ({
          id: channel.id,
          type: channel.type,
          label: channel.label,
          content: channel.content,
          href: channel.href,
          external: channel.external,
          enabled: channel.enabled,
          sortOrder: channel.sortOrder,
          logoSrc: channel.logoSrc,
          logoAlt: channel.logoAlt,
          appendRoomMessage: channel.appendRoomMessage,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }
  })

  await db.insert(auditLogs).values({
    id: makeId("audit"),
    actorEmail,
    entityType: "contact_channels",
    entityId: "global",
    action: "replace",
    changedFields: ["contact_channels"],
  })

  return channels
}
