import { NextResponse } from "next/server"

import { getAdminSession } from "@/lib/auth/session"

export async function requireAdminApiSession() {
  const session = await getAdminSession()

  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Bạn cần đăng nhập admin để thực hiện thao tác này." },
        { status: 401 }
      ),
      session: null,
    }
  }

  return { response: null, session }
}
