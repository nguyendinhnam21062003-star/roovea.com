import { notFound } from "next/navigation"

import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { requireAdminSession } from "@/lib/auth/session"
import { listAdminSuppliers } from "@/lib/services/admin-data"
import { getAdminListing } from "@/lib/services/listings"

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAdminSession()
  const [listing, suppliers] = await Promise.all([
    getAdminListing(id).catch(() => null),
    listAdminSuppliers().catch(() => []),
  ])

  if (!listing) notFound()

  return (
    <UnifiedListingForm
      actorMode="admin"
      initialListing={listing}
      suppliers={suppliers.map((supplier) => ({
        id: supplier.id,
        label: `${supplier.supplierCode} · ${supplier.fullName}`,
      }))}
    />
  )
}
