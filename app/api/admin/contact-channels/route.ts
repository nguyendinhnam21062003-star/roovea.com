import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { requireAdminApiSession } from "@/lib/auth/api"
import {
  listContactChannels,
  replaceContactChannels,
} from "@/lib/services/contact-channels"

function getContactChannelErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return "Dữ liệu contact chưa hợp lệ. Kiểm tra tên, nội dung và đường dẫn của từng kênh."
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (
      message.includes("econnrefused") ||
      message.includes("password authentication failed") ||
      message.includes("database") ||
      message.includes("does not exist")
    ) {
      return "Database PostgreSQL chưa sẵn sàng. Kiểm tra DATABASE_URL, chạy migration rồi thử lưu lại."
    }
  }

  return "Không thể lưu thông tin liên hệ."
}

export async function GET() {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  return NextResponse.json({ contactChannels: await listContactChannels() })
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  try {
    const contactChannels = await replaceContactChannels(
      await request.json(),
      auth.session.email
    )

    return NextResponse.json({ contactChannels })
  } catch (error) {
    console.error("Failed to replace contact channels", error)

    return NextResponse.json(
      { error: getContactChannelErrorMessage(error) },
      { status: error instanceof ZodError ? 400 : 503 }
    )
  }
}
