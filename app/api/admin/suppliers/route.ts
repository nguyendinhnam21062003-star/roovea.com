import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { upsertSupplier } from "@/lib/services/admin-data"

export async function POST(request: Request) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const supplier = await upsertSupplier(
    await request.json(),
    auth.session.email
  )

  return NextResponse.json({ supplier })
}
