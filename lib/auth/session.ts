import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  adminSessionCookieName,
  adminSessionMaxAgeSeconds,
  createAdminSessionToken,
  verifyAdminSessionToken,
  type AdminSession,
} from "@/lib/auth/session-token"

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(adminSessionCookieName)?.value

  return verifyAdminSessionToken(token)
}

export async function requireAdminSession() {
  const session = await getAdminSession()

  if (!session) {
    redirect("/admin/login")
  }

  return session
}

export async function setAdminSessionCookie(email: string) {
  const cookieStore = await cookies()
  const token = await createAdminSessionToken(email)

  cookieStore.set(adminSessionCookieName, token, {
    httpOnly: true,
    maxAge: adminSessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies()

  cookieStore.delete(adminSessionCookieName)
}
