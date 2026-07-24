import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminSuppliers } from "@/lib/services/admin-data"

export default async function NewAdminRentalPage() {
  await requireAdminSession()
  const suppliers = await listAdminSuppliers().catch(() => [])

  return (
    <div className="p-4 sm:p-6">
      <UnifiedListingForm
        actorMode="admin"
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          label: `${supplier.supplierCode} · ${supplier.fullName}`,
        }))}
      />
    </div>
  )
}
