import { NextResponse } from "next/server"

import { getAdminEmail, verifyAdminCredentials } from "@/lib/auth/password"
import { setAdminSessionCookie } from "@/lib/auth/session"

const defaultAdminRedirect = "/admin/messages"

function getAdminRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return defaultAdminRedirect
  }

  if (
    value === "/admin" ||
    value.startsWith("/admin/") ||
    value.startsWith("/admin?")
  ) {
    return value
  }

  return defaultAdminRedirect
}

function buildLoginPath(next: string) {
  const params = new URLSearchParams({ error: "1" })

  if (next !== defaultAdminRedirect) {
    params.set("next", next)
  }

  return `/admin/login?${params.toString()}`
}

function redirect(location: string, init?: ResponseInit) {
  return new NextResponse(null, {
    ...init,
    status: init?.status ?? 303,
    headers: {
      ...init?.headers,
      location,
    },
  })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const next = getAdminRedirectPath(formData.get("next"))

  if (!verifyAdminCredentials(email, password)) {
    return redirect(buildLoginPath(next))
  }

  await setAdminSessionCookie(getAdminEmail())

  return redirect(next)
}
