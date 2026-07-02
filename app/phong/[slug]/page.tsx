import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRightIcon,
  BedIcon,
  CalendarBlankIcon,
  HouseLineIcon,
  MapPinIcon,
  ShareNetworkIcon,
  UsersThreeIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  getPublicRoomBySlug,
  getPublicRooms,
  type PublicRoom,
} from "@/lib/rooms"
import { formatCurrency, formatDate } from "@/lib/format"
import { getPrimaryRoomMedia } from "@/lib/media"

type RoomPageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getPublicRooms().map((room) => ({
    slug: room.slug,
  }))
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { slug } = await params
  const room = getPublicRoomBySlug(slug)

  if (!room) {
    return {
      title: "Không tìm thấy phòng | Roovea.com",
    }
  }

  return {
    title: `${room.name} | Roovea.com`,
    description: room.description,
  }
}

export default async function RoomDetailPage({ params }: RoomPageProps) {
  const { slug } = await params
  const room = getPublicRoomBySlug(slug)

  if (!room) {
    notFound()
  }

  const image = getPrimaryRoomMedia(room.media)
  const videos = room.media.filter((item) => item.type === "video")
  const images = room.media.filter((item) => item.type === "image")

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <section className="border-b px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/#tim-phong">
              <ArrowRightIcon className="rotate-180" data-icon="inline-start" />
              Quay lại danh sách
            </Link>
          </Button>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative aspect-[16/10] min-h-80 overflow-hidden bg-muted">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
            <RoomSummary room={room} />
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mô tả phòng</CardTitle>
                <CardDescription>
                  Mã phòng {room.code} · Cập nhật {formatDate(room.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {room.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {room.highlights.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tiện nghi</CardTitle>
                <CardDescription>
                  Các tiện ích chính được khai báo cho phòng này.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {room.amenities.map((item) => (
                    <div key={item} className="bg-muted px-3 py-2 text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh và video</CardTitle>
                <CardDescription>
                  Tư liệu phòng phục vụ khách xem trước khi liên hệ.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {images.map((item) => (
                    <div
                      key={item.src}
                      className="relative aspect-[4/3] overflow-hidden bg-muted"
                    >
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 50vw, 100vw"
                      />
                    </div>
                  ))}
                </div>
                {videos.map((item) => (
                  <div key={item.src} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <VideoCameraIcon className="size-4" />
                      Video phòng
                    </div>
                    <div className="aspect-video overflow-hidden bg-muted">
                      <iframe
                        src={item.src}
                        title={item.alt}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle>Liên hệ Roovea</CardTitle>
                <CardDescription>
                  Gửi mã phòng {room.code} để được kiểm tra lịch trống và giá
                  cuối.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ContactActions roomCode={room.code} className="flex-col" />
                <Separator />
                <Button asChild variant="outline">
                  <a href={room.googleMapUrl} target="_blank" rel="noreferrer">
                    <MapPinIcon data-icon="inline-start" />
                    Mở Google Map
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function RoomSummary({ room }: { room: PublicRoom }) {
  return (
    <div className="flex flex-col justify-between gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Badge>#{room.code}</Badge>
          <Badge variant="secondary">{room.locationLevel1}</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold md:text-4xl">
            {room.name}
          </h1>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="mt-0.5 size-4 shrink-0" />
            <span>
              {room.address}, {room.locationLevel2}, {room.locationLevel1}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <SummaryFact icon={BedIcon} label={`${room.bedrooms} phòng ngủ`} />
        <SummaryFact icon={UsersThreeIcon} label={`${room.guests} khách`} />
        <SummaryFact icon={HouseLineIcon} label={room.area} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="text-2xl font-semibold">
            {formatCurrency(room.referencePrice)}
          </p>
          <p className="text-sm text-muted-foreground line-through">
            {formatCurrency(room.strikePrice)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarBlankIcon className="size-4" />
          Cập nhật {formatDate(room.updatedAt)}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <a href={`/#lien-he`}>
            <ShareNetworkIcon data-icon="inline-start" />
            Liên hệ tư vấn
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href={room.googleMapUrl} target="_blank" rel="noreferrer">
            <MapPinIcon data-icon="inline-start" />
            Xem bản đồ
          </a>
        </Button>
      </div>
    </div>
  )
}

function SummaryFact({
  icon: Icon,
  label,
}: {
  icon: typeof BedIcon
  label: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 bg-muted px-3 py-3">
      <Icon className="size-4 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  )
}
