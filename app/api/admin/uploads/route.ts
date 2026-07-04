import { NextResponse } from "next/server"

import { requireAdminApiSession } from "@/lib/auth/api"
import { saveRoomImage } from "@/lib/storage/adapter"

export async function POST(request: Request) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file ảnh." }, { status: 400 })
  }

  try {
    const media = await saveRoomImage(file)

    return NextResponse.json({ media })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể upload." },
      { status: 400 }
    )
  }
}
