import { NextResponse } from "next/server"

import { requireUserApiSession } from "@/lib/auth/user-api"
import { getOwnerRental } from "@/lib/services/rentals"
import { saveRoomImage } from "@/lib/storage/adapter"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  const { id } = await params
  const rental = await getOwnerRental(auth.session.user.id, id)

  if (!rental) {
    return NextResponse.json(
      { error: "Bạn không có quyền upload ảnh cho tin này." },
      { status: 403 }
    )
  }

  if (rental.media.images.length >= 12) {
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
