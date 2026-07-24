import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireAdminApiSession } from "@/lib/auth/api"
import {
  getAdminListing,
  saveUnifiedListing,
  updateAdminListingPublicationStatus,
} from "@/lib/services/listings"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()
  if (!auth.session) return auth.response

  const { id } = await params
  const listing = await getAdminListing(id)
  return listing
    ? NextResponse.json({ listing })
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
    const body = await request.json()

    if (body.action === "set_publication_status") {
      const allowedStatuses = new Set([
        "draft",
        "published",
        "hidden",
        "archived",
      ])
      if (!allowedStatuses.has(body.publicationStatus)) {
        return NextResponse.json(
          { error: "Trạng thái tin đăng không hợp lệ." },
          { status: 400 }
        )
      }
      const listing = await updateAdminListingPublicationStatus(
        id,
        body.publicationStatus,
        auth.session.email
      )
      return listing
        ? NextResponse.json({ listing })
        : NextResponse.json(
            { error: "Không tìm thấy tin đăng." },
            { status: 404 }
          )
    }

    const listing = await saveUnifiedListing(
      { ...body, id },
      { mode: "admin", actor: auth.session.email }
    )
    return NextResponse.json({ listing })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
