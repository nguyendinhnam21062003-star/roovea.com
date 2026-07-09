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

function redirectToLogin(requestUrl: string, next: string) {
  const url = new URL("/admin/login", requestUrl)

  url.searchParams.set("error", "1")

  if (next !== defaultAdminRedirect) {
    url.searchParams.set("next", next)
  }

  return NextResponse.redirect(url, 303)
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const next = getAdminRedirectPath(formData.get("next"))

  if (!verifyAdminCredentials(email, password)) {
    return redirectToLogin(request.url, next)
  }

  await setAdminSessionCookie(getAdminEmail())

  return NextResponse.redirect(new URL(next, request.url), 303)
}
