import { NextResponse } from "next/server"

import { apiErrorResponse } from "@/lib/api-error"
import { requireAdminApiSession } from "@/lib/auth/api"
import { setRentalOwnerVerification } from "@/lib/services/app-users"
import { rentalVerificationSchema } from "@/lib/validation/rental"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) return auth.response

  try {
    const { id } = await params
    const { isVerified } = rentalVerificationSchema.parse(await request.json())
    const user = await setRentalOwnerVerification(
      id,
      isVerified,
      auth.session.email
    )

    return user
      ? NextResponse.json({ user })
      : NextResponse.json({ error: "Không tìm thấy chủ nhà." }, { status: 404 })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
