import { RentalListingForm } from "@/components/rentals/rental-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { buildEmptyRentalListing } from "@/lib/rentals/helpers"
import { listAdminSuppliers } from "@/lib/services/admin-data"

export default async function NewAdminRentalPage() {
  await requireAdminSession()
  const rental = { ...buildEmptyRentalListing(), source: "admin" as const }
  const suppliers = await listAdminSuppliers().catch(() => [])

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
