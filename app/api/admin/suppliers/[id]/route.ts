import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { deleteSupplier, upsertSupplier } from "@/lib/services/admin-data"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params
  const supplier = await upsertSupplier(
    { ...(await request.json()), id },
    auth.session.email
  )

  return NextResponse.json({ supplier })
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
  const result = await deleteSupplier(id, auth.session.email)

  return NextResponse.json(result)
}
