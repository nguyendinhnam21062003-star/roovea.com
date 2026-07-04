"use server"

import { redirect } from "next/navigation"

import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "@/lib/auth/session"
import { getAdminEmail, verifyAdminCredentials } from "@/lib/auth/password"

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "/admin/messages")

  if (!verifyAdminCredentials(email, password)) {
    redirect("/admin/login?error=1")
  }

  await setAdminSessionCookie(getAdminEmail())
  redirect(next.startsWith("/admin") ? next : "/admin/messages")
}

export async function logoutAdmin() {
  await clearAdminSessionCookie()
  redirect("/admin/login")
}
