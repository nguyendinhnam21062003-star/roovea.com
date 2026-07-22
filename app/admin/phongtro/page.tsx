import { AdminRentalsPage } from "@/components/admin/admin-rentals-page"
import { requireAdminSession } from "@/lib/auth/session"
import { listRentalOwners } from "@/lib/services/app-users"
import { listAdminRentals } from "@/lib/services/rentals"

export default async function AdminRentalPage() {
  await requireAdminSession()
  const [initialRentals, initialOwners] = await Promise.all([
    listAdminRentals().catch(() => []),
    listRentalOwners().catch(() => []),
  ])

  return (
    <AdminRentalsPage
      initialRentals={initialRentals}
      initialOwners={initialOwners}
    />
  )
}
