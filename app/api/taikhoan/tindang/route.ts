import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireUserApiSession } from "@/lib/auth/user-api"
import {
  listOwnerRentals,
  saveRentalListing,
} from "@/lib/services/rentals"

export async function GET() {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  const rentals = await listOwnerRentals(auth.session.user.id)
  return NextResponse.json({ rentals })
}

export async function POST(request: Request) {
  const auth = await requireUserApiSession()

  if (!auth.session) return auth.response

  try {
    const rental = await saveRentalListing(await request.json(), {
      actor: auth.session.user.email,
      mode: "owner",
      ownerPhone: auth.session.user.phone,
      ownerUserId: auth.session.user.id,
    })

    return NextResponse.json({ rental })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
