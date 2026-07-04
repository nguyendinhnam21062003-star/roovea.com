import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import {
  getUnreadInquiryCount,
  listAdminInquiries,
} from "@/lib/services/inquiries"

export async function GET(request: Request) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const url = new URL(request.url)
  const inquiries = await listAdminInquiries({
    query: url.searchParams.get("q") ?? "",
    source: url.searchParams.get("source") ?? "all",
    status: url.searchParams.get("status") ?? "all",
  })

  return NextResponse.json({
    inquiries,
    unreadInquiryCount: await getUnreadInquiryCount(),
  })
}
