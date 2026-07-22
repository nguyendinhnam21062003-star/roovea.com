import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { cache } from "react"
import { and, eq, gt, lt } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/db/client"
import { appUsers, appUserSessions } from "@/db/schema"

export const userSessionCookieName = "roovea_user_session"
export const userSessionMaxAgeSeconds = 60 * 60 * 24 * 30

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export type UserSession = {
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl: string
    phone: string
    zalo: string
    isVerified: boolean
    status: "active" | "suspended"
  }
  expiresAt: Date
}

export const getUserSession = cache(async (): Promise<UserSession | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(userSessionCookieName)?.value

  if (!token) return null

  try {
    const rows = await db
      .select({
        expiresAt: appUserSessions.expiresAt,
        id: appUsers.id,
        email: appUsers.email,
        displayName: appUsers.displayName,
        avatarUrl: appUsers.avatarUrl,
        phone: appUsers.phone,
        zalo: appUsers.zalo,
        isVerified: appUsers.isVerified,
        status: appUsers.status,
      })
      .from(appUserSessions)
      .innerJoin(appUsers, eq(appUserSessions.userId, appUsers.id))
      .where(
        and(
          eq(appUserSessions.id, hashSessionToken(token)),
          gt(appUserSessions.expiresAt, new Date()),
          eq(appUsers.status, "active")
        )
      )
      .limit(1)
    const row = rows[0]

    if (!row) return null

    return {
      expiresAt: row.expiresAt,
      user: {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl ?? "",
        phone: row.phone ?? "",
        zalo: row.zalo ?? "",
        isVerified: row.isVerified,
        status: row.status,
      },
    }
  } catch {
    return null
  }
})

export async function requireUserSession(nextPath = "/taikhoan/tindang") {
  const session = await getUserSession()

  if (!session) {
    redirect(`/dangnhap?next=${encodeURIComponent(nextPath)}`)
  }

  return session
}

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + userSessionMaxAgeSeconds * 1000)

  await db.transaction(async (tx) => {
    await tx
      .delete(appUserSessions)
      .where(lt(appUserSessions.expiresAt, new Date()))
    await tx.insert(appUserSessions).values({
      id: hashSessionToken(token),
      userId,
      expiresAt,
    })
  })

  const cookieStore = await cookies()
  cookieStore.set(userSessionCookieName, token, {
    httpOnly: true,
    maxAge: userSessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(userSessionCookieName)?.value

  if (token) {
    await db
      .delete(appUserSessions)
      .where(eq(appUserSessions.id, hashSessionToken(token)))
      .catch(() => undefined)
  }

  cookieStore.delete(userSessionCookieName)
}
