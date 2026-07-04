import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { deleteRoom, upsertRoom } from "@/lib/services/admin-data"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params
  const room = await upsertRoom(
    { ...(await request.json()), id },
    auth.session.email
  )

  return NextResponse.json({ room })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params

  await deleteRoom(id, auth.session.email)

  return NextResponse.json({ ok: true })
}
