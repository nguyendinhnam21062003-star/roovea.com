import Image from "next/image"
import Link from "next/link"
import {
  ArrowRightIcon,
  HouseLineIcon,
  MapPinIcon,
  SparkleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { RoomExplorer } from "@/components/room-explorer"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPrimaryRoomMedia } from "@/lib/media"
import { getPublicRooms } from "@/lib/rooms"

export default function Page() {
  const rooms = getPublicRooms()
  const heroImage = getPrimaryRoomMedia(rooms[0]?.media ?? [])

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <section className="relative flex min-h-[78svh] overflow-hidden border-b">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          className="object-cover opacity-55"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="relative mx-auto flex w-full max-w-7xl items-end px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex max-w-3xl flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <HouseLineIcon data-icon="inline-start" />
                MVP lưu trú
              </Badge>
              <Badge variant="outline">
                <MapPinIcon data-icon="inline-start" />
                Việt Nam
              </Badge>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="font-heading text-5xl font-semibold text-foreground sm:text-6xl lg:text-7xl">
                Roovea.com
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Tìm nơi lưu trú phù hợp cho khách du lịch, nhóm bạn, gia đình
                hoặc chuyến công tác với mã phòng rõ ràng và tư vấn trực tiếp.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link href="#tim-phong">
                  Tìm phòng ngay
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#lien-he">
                  <SparkleIcon data-icon="inline-start" />
                  Liên hệ tư vấn
                </Link>
              </Button>
            </div>
            <div className="grid max-w-2xl grid-cols-3 gap-2 text-xs sm:text-sm">
              <HeroMetric value={`${rooms.length}+`} label="phòng mẫu" />
              <HeroMetric value="5 chữ số" label="mã tìm nhanh" />
              <HeroMetric value="1 link" label="share chi tiết" />
            </div>
          </div>
        </div>
      </section>

      <RoomExplorer rooms={rooms} />

      <section
        id="lien-he"
        className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="flex flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              Roovea hỗ trợ trực tiếp
            </Badge>
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">
              Cần tìm phòng, dịch vụ phù hợp hoặc muốn trở thành đối tác?
            </h2>
          </div>
          <div className="flex flex-col gap-4 border bg-muted/30 p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Gửi nhu cầu lưu trú, ngân sách, khu vực và số khách. Roovea sẽ
              phản hồi qua kênh bạn chọn.
            </p>
            <ContactActions />
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border bg-background/70 px-3 py-3 backdrop-blur">
      <span className="font-heading text-lg font-semibold">{value}</span>
      <span className="truncate text-muted-foreground">{label}</span>
    </div>
  )
}
