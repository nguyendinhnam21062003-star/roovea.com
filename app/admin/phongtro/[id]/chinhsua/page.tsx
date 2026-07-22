import { notFound } from "next/navigation"

import { RentalListingForm } from "@/components/rentals/rental-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminSuppliers } from "@/lib/services/admin-data"
import { getAdminRental } from "@/lib/services/rentals"

export default async function EditAdminRentalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminSession()
  const { id } = await params
  const [rental, suppliers] = await Promise.all([
    getAdminRental(id).catch(() => null),
    listAdminSuppliers().catch(() => []),
  ])

  if (!rental) notFound()

  return (
    <div className="p-4 sm:p-6">
      <RentalListingForm
        mode="admin"
        initialRental={rental}
        suppliers={suppliers}
      />
    </div>
  )
}
