import { notFound } from "next/navigation"

import { RentalListingForm } from "@/components/rentals/rental-listing-form"
import { requireUserSession } from "@/lib/auth/user-session"
import { getOwnerRental } from "@/lib/services/rentals"

export default async function EditRentalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireUserSession()
  const { id } = await params
  const rental = await getOwnerRental(session.user.id, id)

  if (!rental) notFound()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">{rental.code}</p>
        <h1 className="font-heading text-3xl font-semibold">Chỉnh sửa tin</h1>
      </div>
      <RentalListingForm initialRental={rental} mode="owner" />
    </div>
  )
}
