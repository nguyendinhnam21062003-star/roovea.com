import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireUserApiSession } from "@/lib/auth/user-api"
import { updateRentalOwnerProfile } from "@/lib/services/app-users"

export async function GET() {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  return NextResponse.json({ profile: auth.session.user })
}

export async function PATCH(request: Request) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  try {
    const user = await updateRentalOwnerProfile(
      auth.session.user.id,
      await request.json()
    )

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? "",
        phone: user.phone ?? "",
        zalo: user.zalo ?? "",
        isVerified: user.isVerified,
        status: user.status,
      },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
