import type { Metadata } from "next"

import { ContactActions } from "@/components/contact-actions"
import { RentalExplorer } from "@/components/rentals/rental-explorer"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { getPublicRentalListings } from "@/lib/services/rentals"

export const metadata: Metadata = {
  title: "Tìm phòng trọ TP.HCM | Roovea",
  description:
    "Tìm phòng trọ, căn hộ mini và chỗ ở dài hạn tại TP.HCM với sự hỗ trợ trực tiếp từ Roovea.",
}

export const dynamic = "force-dynamic"

export default async function RentalSearchPage() {
  const rentals = await getPublicRentalListings()

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <RentalExplorer rentals={rentals} />

      <section
        id="lienhe"
        className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="secondary" className="w-fit">
              Roovea hỗ trợ trực tiếp
            </Badge>
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">
              Chưa tìm thấy phòng trọ đúng nhu cầu?
            </h2>
          </div>
          <div className="flex w-full flex-col items-center gap-4 border bg-muted/30 p-4">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Gửi khu vực, ngân sách, số người ở và những tiện ích bạn cần.
              Roovea sẽ phản hồi qua kênh bạn chọn.
            </p>
            <ContactActions
              className="justify-center"
              label="Nhờ Roovea tìm giúp"
            />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
