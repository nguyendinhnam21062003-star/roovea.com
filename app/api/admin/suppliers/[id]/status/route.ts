import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdminApiSession } from "@/lib/auth/api"
import {
  listAdminSuppliers,
  setSupplierStatus,
} from "@/lib/services/admin-data"

const statusSchema = z.object({
  status: z.enum(["active", "paused", "discontinued"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiSession()

  if (!auth.session) {
    return auth.response
  }

  const { id } = await params
  const { status } = statusSchema.parse(await request.json())

  await setSupplierStatus(id, status, auth.session.email)

  const supplier = (await listAdminSuppliers()).find((item) => item.id === id)

  if (!supplier) {
    return NextResponse.json(
      { error: "Không tìm thấy nhà cung cấp." },
      { status: 404 }
    )
  }

  return NextResponse.json({ supplier })
}
