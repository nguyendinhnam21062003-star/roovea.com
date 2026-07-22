import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  adminSessionCookieName,
  verifyAdminSessionToken,
} from "@/lib/auth/session-token"
import { getPublicAppUrl } from "@/lib/http/redirect"

function redirect(request: NextRequest, pathname: string) {
  return NextResponse.redirect(getPublicAppUrl(pathname, request.url))
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(adminSessionCookieName)?.value
  const session = await verifyAdminSessionToken(token)

  if (pathname.startsWith("/admin/login")) {
    if (session) {
      return redirect(request, "/admin/messages")
    }

    return NextResponse.next()
  }

  if (pathname === "/api/admin/login") {
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

  return redirect(request, `/admin/login?next=${encodeURIComponent(pathname)}`)
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
