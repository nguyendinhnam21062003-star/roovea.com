import "server-only"

import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { appUsers } from "@/db/schema"
import { makeId } from "@/lib/admin/helpers"
import type { RentalOwnerProfile } from "@/lib/rentals/types"
import { rentalProfileSchema } from "@/lib/validation/rental"

type GoogleIdentity = {
  subject: string
  email: string
  displayName: string
  avatarUrl: string
}

export async function upsertGoogleUser(identity: GoogleIdentity) {
  const now = new Date()
  const existingBySubject = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.googleSubject, identity.subject))
    .limit(1)
  const existingByEmail = existingBySubject[0]
    ? []
    : await db
        .select()
        .from(appUsers)
        .where(eq(appUsers.email, identity.email.toLowerCase()))
        .limit(1)
  const existing = existingBySubject[0] ?? existingByEmail[0]

  if (existing) {
    const rows = await db
      .update(appUsers)
      .set({
        googleSubject: identity.subject,
        email: identity.email.toLowerCase(),
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl || existing.avatarUrl,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(appUsers.id, existing.id))
      .returning()

    return rows[0]
  }

  const rows = await db
    .insert(appUsers)
    .values({
      id: makeId("user"),
      googleSubject: identity.subject,
      email: identity.email.toLowerCase(),
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      lastLoginAt: now,
    })
    .returning()

  return rows[0]
}

export async function updateRentalOwnerProfile(userId: string, input: unknown) {
  const profile = rentalProfileSchema.parse(input)
  const rows = await db
    .update(appUsers)
    .set({
      displayName: profile.displayName,
      phone: profile.phone,
      zalo: profile.zalo || profile.phone,
      updatedAt: new Date(),
    })
    .where(eq(appUsers.id, userId))
    .returning()

  return rows[0]
}

export async function listRentalOwners(): Promise<RentalOwnerProfile[]> {
  const rows = await db.select().from(appUsers).orderBy(appUsers.createdAt)

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl ?? "",
    phone: row.phone ?? "",
    zalo: row.zalo ?? "",
    isVerified: row.isVerified,
    status: row.status,
  }))
}

export async function setRentalOwnerVerification(
  userId: string,
  isVerified: boolean,
  actorEmail: string
) {
  const rows = await db
    .update(appUsers)
    .set({
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
      verifiedBy: isVerified ? actorEmail : null,
      updatedAt: new Date(),
    })
    .where(eq(appUsers.id, userId))
    .returning()

  return rows[0] ?? null
}
