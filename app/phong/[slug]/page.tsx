import type { ComponentType } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRightIcon,
  BathtubIcon,
  BedIcon,
  HouseLineIcon,
  InfoIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { CopyableAddress } from "@/components/copyable-address"
import { RoomGallery } from "@/components/room-gallery"
import { RoomCard } from "@/components/room-explorer"
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
import { formatCurrency } from "@/lib/format"
import { getVideoEmbedUrl } from "@/lib/media"
import {
  getAccommodationType,
  getBathroomCount,
  getRoomDiscount,
  getRoomPolicies,
} from "@/lib/rooms"
import { getPublicRoomBySlug, getPublicRooms } from "@/lib/rooms-data"

type RoomPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { slug } = await params
  const room = await getPublicRoomBySlug(slug)

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
  const room = await getPublicRoomBySlug(slug)

  if (!room) {
    notFound()
  }

  const videos = room.media.filter((item) => item.type === "video")
  const accommodationType = getAccommodationType(room)
  const bathrooms = getBathroomCount(room)
  const discount = getRoomDiscount(room)
  const policies = getRoomPolicies(room)
  const fullAddress = `${room.address}, ${room.locationLevel1}`
  const checkTimePolicyItems = [
    {
      icon: InfoIcon,
      label: "Nhận phòng",
      text: `Từ ${policies.checkIn}`,
      tone: "neutral",
    },
    {
      icon: InfoIcon,
      label: "Trả phòng",
      text: `Trước ${policies.checkOut}`,
      tone: "neutral",
    },
  ] as const
  const similarRooms = (await getPublicRooms())
    .filter((item) => item.slug !== room.slug)
    .slice(0, 3)

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <div className="border-b bg-muted/30 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 pb-5 text-sm text-muted-foreground">
          <Link href="/">Trang chủ</Link>
          <ArrowRightIcon className="size-3" />
          <Link href="/#tim-phong">Tìm phòng</Link>
          <ArrowRightIcon className="size-3" />
          <span className="truncate text-foreground">{room.name}</span>
        </div>
      </div>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <RoomGallery
            media={room.media}
            roomCode={room.code}
            roomName={room.name}
          />

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardDescription>
                  Giá tham khảo · Mã phòng #{room.code}
                </CardDescription>
                <CardTitle>Thông tin đặt phòng</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-semibold">
                    {formatCurrency(room.referencePrice)}
                  </span>
                </div>
                <CardDescription>
                  <span className="line-through">
                    {formatCurrency(room.strikePrice)}
                  </span>
                  {discount ? (
                    <span> · Tiết kiệm {formatCurrency(discount.saving)}</span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <BookingFact
                    icon={UsersThreeIcon}
                    label={`${room.guests} khách`}
                  />
                  <BookingFact icon={BedIcon} label={`${room.bedrooms} PN`} />
                  <BookingFact icon={BathtubIcon} label={`${bathrooms} PT`} />
                </div>
                <ContactActions
                  roomCode={room.code}
                  triggerClassName="w-full"
                />
                <Separator />
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span>Không cần thanh toán trước qua website.</span>
                  <span>Roovea xác nhận lại giá cuối trước khi chốt.</span>
                  <span>Hỗ trợ tư vấn trực tiếp theo mã phòng.</span>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      <section className="border-t px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8">
          <div className="border-b pb-8">
            <div className="flex max-w-4xl flex-col gap-4">
              <div className="flex min-w-0 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{room.locationLevel1}</Badge>
                  <span>{room.locationLevel2}</span>
                  <span>·</span>
                  <span>Mã #{room.code}</span>
                </div>
                <h1 className="font-heading text-3xl font-semibold md:text-5xl">
                  {room.name}
                </h1>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <CopyableAddress address={fullAddress} />
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {room.googleMapUrl ? (
                    <Button asChild variant="outline" className="w-fit">
                      <a
                        href={room.googleMapUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MapPinIcon data-icon="inline-start" />
                        Mở Google Maps
                      </a>
                    </Button>
                  ) : null}
                  <ContactActions
                    label="Liên hệ tư vấn"
                    roomCode={room.code}
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <DetailFact
              icon={UsersThreeIcon}
              title={`${room.guests} khách`}
              text="Sức chứa"
            />
            <DetailFact
              icon={BedIcon}
              title={`${room.bedrooms} phòng ngủ`}
              text="Không gian riêng"
            />
            <DetailFact
              icon={BathtubIcon}
              title={`${bathrooms} phòng tắm`}
              text="Phòng tắm"
            />
            <DetailFact
              icon={HouseLineIcon}
              title={accommodationType}
              text="Loại hình lưu trú"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.82fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <InfoIcon className="size-4 text-primary" />
                  Mô tả phòng
                </CardTitle>
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
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-primary" />
                  Chính sách
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {checkTimePolicyItems.map((item) => (
                    <CheckTimeBadge
                      key={item.label}
                      label={item.label}
                      text={item.text}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vị trí lưu trú</CardTitle>
              <CardDescription>{room.address}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="aspect-[16/7] min-h-72 overflow-hidden bg-muted">
                <iframe
                  title={`Bản đồ ${room.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    room.address
                  )}&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {room.googleMapUrl ? (
                <Button asChild variant="outline" className="w-fit">
                  <a href={room.googleMapUrl} target="_blank" rel="noreferrer">
                    <MapPinIcon data-icon="inline-start" />
                    Xem trên Google Map
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {videos.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Video phòng</CardTitle>
                <CardDescription>
                  Video nhúng được khai báo cho phòng.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {videos.map((item) => {
                  const embedUrl = getVideoEmbedUrl(item.src)

                  return (
                    <div
                      key={item.src}
                      className="aspect-video overflow-hidden bg-muted"
                    >
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={item.alt}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Button asChild variant="secondary">
                            <a href={item.src} target="_blank" rel="noreferrer">
                              Mở video
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : null}

          <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="secondary">Có thể bạn quan tâm</Badge>
                <h2 className="mt-2 font-heading text-2xl font-semibold">
                  Phòng tương tự
                </h2>
              </div>
              <Button asChild variant="outline">
                <Link href="/#tim-phong">Xem tất cả</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {similarRooms.map((item) => (
                <RoomCard key={item.slug} room={item} />
              ))}
            </div>
          </section>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function CheckTimeBadge({ label, text }: { label: string; text: string }) {
  return (
    <Badge variant="secondary" className="h-7 gap-1.5 px-2.5">
      <InfoIcon data-icon="inline-start" />
      {label}
      <span className="font-normal text-muted-foreground">{text}</span>
    </Badge>
  )
}

function BookingFact({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border bg-muted/30 p-2">
      <Icon className="size-4 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </div>
  )
}

function DetailFact({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border bg-card p-3">
      <Icon className="size-4 text-primary" />
      <strong className="truncate text-sm">{title}</strong>
      <span className="truncate text-xs text-muted-foreground">{text}</span>
    </div>
  )
}
