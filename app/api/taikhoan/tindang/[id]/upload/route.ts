import { NextResponse } from "next/server"

import { requireUserApiSession } from "@/lib/auth/user-api"
import { getOwnerListing } from "@/lib/services/listings"
import { saveRoomImage } from "@/lib/storage/adapter"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  const listing = await getOwnerListing(auth.session.user.id, id)

  if (!listing) {
    return NextResponse.json(
      { error: "Bạn không có quyền upload ảnh cho tin này." },
      { status: 403 }
    )
  }

  if (listing.media.images.length >= 12) {
    return NextResponse.json(
      { error: "Mỗi tin được tải tối đa 12 ảnh." },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 })
  }

  try {
    return NextResponse.json({ media: await saveRoomImage(file) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể upload." },
      { status: 400 }
    )
  }
}
