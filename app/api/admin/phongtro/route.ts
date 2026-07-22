import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireAdminApiSession } from "@/lib/auth/api"
import {
  listAdminRentals,
  saveRentalListing,
} from "@/lib/services/rentals"

export async function GET() {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  return NextResponse.json({ rentals: await listAdminRentals() })
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  try {
    const rental = await saveRentalListing(await request.json(), {
      actor: auth.session.email,
      mode: "admin",
    })

    return NextResponse.json({ rental })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
