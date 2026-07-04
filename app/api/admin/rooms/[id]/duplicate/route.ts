import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { duplicateRoom } from "@/lib/services/admin-data"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params
  const room = await duplicateRoom(id, auth.session.email)

  if (!room) {
    return NextResponse.json(
      { error: "Không tìm thấy phòng." },
      { status: 404 }
    )
  }

  return NextResponse.json({ room })
}
