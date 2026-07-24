import Link from "next/link"
import { PlusIcon } from "@phosphor-icons/react/dist/ssr"

import { OwnerRentalList } from "@/components/account/owner-rental-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { requireUserSession } from "@/lib/auth/user-session"
import { listOwnerListings } from "@/lib/services/listings"

export default async function AccountRentalsPage() {
  const session = await requireUserSession("/taikhoan/tindang")
  const listings = await listOwnerListings(session.user.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Quản lý tin đăng</p>
          <h1 className="font-heading text-3xl font-semibold">Tin đăng của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Tạo và cập nhật tình trạng từng phòng cụ thể.
          </p>
        </div>
        <Button asChild>
          <Link href="/taikhoan/tindang/moi">
            <PlusIcon data-icon="inline-start" />
            Đăng tin mới
          </Link>
        </Button>
      </div>
      {!session.user.phone ? (
        <Alert>
          <AlertTitle>Hồ sơ chưa có số điện thoại</AlertTitle>
          <AlertDescription>
            Tin vẫn được tự động công khai, tuy nhiên bạn nên hoàn thành{" "}
            <Link href="/taikhoan/hoso" className="underline underline-offset-4">
              hồ sơ liên hệ
            </Link>{" "}
            để đội ngũ Roovea có thể hỗ trợ khi cần.
          </AlertDescription>
        </Alert>
      ) : null}
      <OwnerRentalList listings={listings} />
    </div>
  )
}
