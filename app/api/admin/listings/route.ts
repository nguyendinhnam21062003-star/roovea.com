import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireAdminApiSession } from "@/lib/auth/api"
import {
  listAdminListings,
  saveUnifiedListing,
} from "@/lib/services/listings"

export async function GET() {
  const auth = await requireAdminApiSession()
  if (!auth.session) return auth.response

  try {
    return NextResponse.json({ listings: await listAdminListings() })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminApiSession()
  if (!auth.session) return auth.response

  try {
    const listing = await saveUnifiedListing(await request.json(), {
      mode: "admin",
      actor: auth.session.email,
    })
    return NextResponse.json({ listing })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
