import { NextResponse } from "next/server"

import {
  checkInquiryRateLimit,
  createCustomerInquiry,
} from "@/lib/services/inquiries"

function getPublicErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : ""

  if (
    message.includes("Failed query") ||
    message.includes("ECONNREFUSED") ||
    message.includes("does not exist")
  ) {
    return "Hệ thống lưu tin nhắn chưa sẵn sàng. Bạn vui lòng dùng nút Liên hệ trực tiếp để gọi/Zalo/Facebook."
  }

  return message || "Không thể gửi yêu cầu hỗ trợ."
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor?.split(",")[0]?.trim() || "local"

  if (!checkInquiryRateLimit(ip)) {
    return NextResponse.json(
      { error: "Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút." },
      { status: 429 }
    )
  }

  try {
    const inquiry = await createCustomerInquiry(await request.json())

    return NextResponse.json({ inquiry })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error) },
      { status: 400 }
    )
  }
}
