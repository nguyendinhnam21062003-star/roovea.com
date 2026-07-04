import { ContactActions } from "@/components/contact-actions"
import { RoomExplorer } from "@/components/room-explorer"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { getPublicRooms } from "@/lib/rooms-data"

export const dynamic = "force-dynamic"

export default async function Page() {
  const rooms = await getPublicRooms()

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <RoomExplorer rooms={rooms} />

      <section
        id="lien-he"
        className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Badge variant="secondary" className="w-fit">
              Roovea hỗ trợ trực tiếp
            </Badge>
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">
              Cần tìm phòng, dịch vụ phù hợp hoặc muốn trở thành đối tác?
            </h2>
          </div>
          <div className="flex w-full flex-col items-center gap-4 border bg-muted/30 p-4">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Gửi nhu cầu lưu trú, ngân sách, khu vực và số khách. Roovea sẽ
              phản hồi qua kênh bạn chọn.
            </p>
            <ContactActions className="justify-center" label="Cần hỗ trợ" />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
