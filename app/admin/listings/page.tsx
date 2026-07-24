import { AdminListingsPage } from "@/components/admin/admin-listings-page"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminListings } from "@/lib/services/listings"

export default async function AdminListingsRoute() {
  await requireAdminSession()
  const listings = await listAdminListings().catch(() => [])

  return <AdminListingsPage initialListings={listings} />
}
