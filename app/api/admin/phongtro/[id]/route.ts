import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireAdminApiSession } from "@/lib/auth/api"
import {
  deleteAdminRental,
  getAdminRental,
  saveRentalListing,
} from "@/lib/services/rentals"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  const rental = await getAdminRental(id)

  return rental
    ? NextResponse.json({ rental })
    : NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  try {
    const { id } = await params
    const rental = await saveRentalListing(
      { ...(await request.json()), id },
      { actor: auth.session.email, mode: "admin" }
    )

    return rental
      ? NextResponse.json({ rental })
      : NextResponse.json({ error: "Không tìm thấy tin." }, { status: 404 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  await deleteAdminRental(id, auth.session.email)

  return NextResponse.json({ ok: true })
}
