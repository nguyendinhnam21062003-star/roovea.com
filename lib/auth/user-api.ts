import { NextResponse } from "next/server"

import { getUserSession } from "@/lib/auth/user-session"

export async function requireUserApiSession() {
  const session = await getUserSession()

  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Bạn cần đăng nhập để thực hiện thao tác này." },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { response: null, session }
}
