import { RentalListingForm } from "@/components/rentals/rental-listing-form"
import { requireUserSession } from "@/lib/auth/user-session"

export default async function NewRentalPage() {
  await requireUserSession("/taikhoan/tindang/moi")

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary">Tin phòng trọ</p>
        <h1 className="font-heading text-3xl font-semibold">Đăng tin mới</h1>
      </div>
      <RentalListingForm mode="owner" />
    </div>
  )
}
