import { notFound } from "next/navigation"

import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminSuppliers } from "@/lib/services/admin-data"
import { getAdminListing } from "@/lib/services/listings"

export default async function EditAdminRentalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminSession()
  const { id } = await params
  const [listing, suppliers] = await Promise.all([
    getAdminListing(id).catch(() => null),
    listAdminSuppliers().catch(() => []),
  ])

  if (!listing) notFound()

  return (
    <div className="p-4 sm:p-6">
      <UnifiedListingForm
        actorMode="admin"
        initialListing={listing}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          label: `${supplier.supplierCode} · ${supplier.fullName}`,
        }))}
      />
    </div>
  )
}
