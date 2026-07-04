import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { updateAdminInquiry } from "@/lib/services/inquiries"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params
  const inquiry = await updateAdminInquiry(id, await request.json())

  if (!inquiry) {
    return NextResponse.json(
      { error: "Không tìm thấy tin nhắn." },
      { status: 404 }
    )
  }

  return NextResponse.json({ inquiry })
}
