import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminSuppliers } from "@/lib/services/admin-data"

export default async function NewRoomPage() {
  await requireAdminSession()
  const suppliers = await listAdminSuppliers().catch(() => [])

  return (
    <UnifiedListingForm
      actorMode="admin"
      defaultStayType="short_stay"
      suppliers={suppliers.map((supplier) => ({
        id: supplier.id,
        label: `${supplier.supplierCode} · ${supplier.fullName}`,
      }))}
    />
  )
}
