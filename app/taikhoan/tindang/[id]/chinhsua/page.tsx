import { notFound } from "next/navigation"

import { UnifiedListingForm } from "@/components/listings/unified-listing-form"
import { requireUserSession } from "@/lib/auth/user-session"
import { getOwnerListing } from "@/lib/services/listings"

export default async function EditRentalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireUserSession()
  const { id } = await params
  const listing = await getOwnerListing(session.user.id, id)

  if (!listing) notFound()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">{listing.code}</p>
        <h1 className="font-heading text-3xl font-semibold">Chỉnh sửa tin</h1>
      </div>
      <UnifiedListingForm initialListing={listing} actorMode="owner" />
    </div>
  )
}
