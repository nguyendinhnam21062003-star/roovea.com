import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  adminSessionCookieName,
  verifyAdminSessionToken,
} from "@/lib/auth/session-token"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(adminSessionCookieName)?.value
  const session = await verifyAdminSessionToken(token)

  if (pathname.startsWith("/admin/login")) {
    if (session) {
      return NextResponse.redirect(new URL("/admin/messages", request.url))
    }

    return NextResponse.next()
  }

  if (session) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: "Bạn cần đăng nhập admin để thực hiện thao tác này." },
      { status: 401 }
    )
  }

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("next", pathname)

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
