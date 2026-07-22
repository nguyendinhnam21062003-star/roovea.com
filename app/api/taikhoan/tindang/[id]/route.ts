import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireUserApiSession } from "@/lib/auth/user-api"
import {
  archiveOwnerRental,
  getOwnerRental,
  saveRentalListing,
} from "@/lib/services/rentals"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  const rental = await getOwnerRental(auth.session.user.id, id)

  return rental
    ? NextResponse.json({ rental })
    : NextResponse.json({ error: "Không tìm thấy tin đăng." }, { status: 404 })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  try {
    const { id } = await params
    const rental = await saveRentalListing(
      { ...(await request.json()), id },
      {
        actor: auth.session.user.email,
        mode: "owner",
        ownerPhone: auth.session.user.phone,
        ownerUserId: auth.session.user.id,
      }
    )

    return rental
      ? NextResponse.json({ rental })
      : NextResponse.json(
          { error: "Bạn không có quyền sửa tin này." },
          { status: 403 }
        )
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  const archived = await archiveOwnerRental(auth.session.user.id, id)

  return archived
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "Bạn không có quyền lưu trữ tin này." },
        { status: 403 }
      )
}
