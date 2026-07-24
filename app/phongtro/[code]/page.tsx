import type { ComponentType } from "react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRightIcon,
  CheckCircleIcon,
  HouseLineIcon,
  InfoIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { CopyableAddress } from "@/components/copyable-address"
import { RoomGallery } from "@/components/room-gallery"
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
  getRentalAmenityLabel,
  getRentalTypeLabel,
  rentalAvailabilityStatusLabels,
} from "@/lib/rentals/options"
import type { PublicRentalListing } from "@/lib/rentals/types"
import {
  getPublicRentalByCode,
  getPublicRentalListings,
} from "@/lib/services/rentals"

type RentalPageProps = {
  params: Promise<{ code: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: RentalPageProps): Promise<Metadata> {
  const { code } = await params
  const rental = await getPublicRentalByCode(code)

  return rental
    ? {
        title: `${rental.name} | Roovea`,
        description: rental.description.slice(0, 155),
      }
    : { title: "Không tìm thấy phòng | Roovea" }
}

export default async function RentalDetailPage({ params }: RentalPageProps) {
  const { code } = await params
  const rental = await getPublicRentalByCode(code)

  if (!rental) notFound()

  const available = rental.availabilityStatus === "available"
  const media = [
    ...rental.media.images.map((image) => ({
      type: "image" as const,
      src: image.url,
      alt: image.caption || rental.name,
    })),
    ...rental.media.videoUrls.map((url) => ({
      type: "video" as const,
      src: url,
      alt: `Video ${rental.name}`,
    })),
  ]
  const fullAddress = rental.addressDetail
  const amenities = [...rental.amenities, ...rental.customAmenities]
  const videos = rental.media.videoUrls
  const similarRentals = (await getPublicRentalListings())
    .filter((item) => item.code !== rental.code)
    .slice(0, 3)

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <div className="border-b bg-muted/30 px-4 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 pb-5 text-sm text-muted-foreground">
          <Link href="/">Trang chủ</Link>
          <ArrowRightIcon className="size-3" />
          <Link href="/timphongtro">Tìm phòng trọ</Link>
          <ArrowRightIcon className="size-3" />
          <span className="truncate text-foreground">{rental.name}</span>
        </div>
      </div>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <RoomGallery
            media={media}
            roomCode={rental.code}
            roomName={rental.name}
          />

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardDescription>
                  Giá thuê hàng tháng · Mã phòng #{rental.code}
                </CardDescription>
                <CardTitle>Thông tin thuê phòng</CardTitle>
                <span className="text-2xl font-semibold">
                  {formatCurrency(rental.monthlyPrice)}
                  <span className="text-base font-normal text-muted-foreground">
                    /tháng
                  </span>
                </span>
                <CardDescription>
                  {rentalAvailabilityStatusLabels[rental.availabilityStatus]}
                  {rental.ownerVerified ? " · Chủ nhà đã xác minh" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <BookingFact
                    icon={HouseLineIcon}
                    label={`${rental.areaM2} m²`}
                  />
                  <BookingFact
                    icon={UsersThreeIcon}
                    label={`Tối đa ${rental.maxOccupants} người`}
                  />
                  <BookingFact
                    icon={HouseLineIcon}
                    label={getRentalTypeLabel(
                      rental.rentalType,
                      rental.otherRentalType
                    )}
                  />
                </div>
                {available ? (
                  <ContactActions
                    roomCode={rental.code}
                    label="Liên hệ Roovea"
                    triggerClassName="w-full"
                  />
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/timphongtro">Xem phòng đang còn</Link>
                  </Button>
                )}
                <Separator />
                <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                  <span>Điện: {rental.electricityPrice}</span>
                  <span>Nước: {rental.waterPrice}</span>
                  {rental.otherCosts ? (
                    <span>Khác: {rental.otherCosts}</span>
                  ) : null}
                  <span>
                    Roovea kết nối trực tiếp với chủ nhà trước khi chốt.
                  </span>
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
                  <Badge variant="outline">
                    {getRentalTypeLabel(
                      rental.rentalType,
                      rental.otherRentalType
                    )}
                  </Badge>
                  <span>{rental.legacyWard}</span>
                  <span>·</span>
                  <span>{rental.legacyDistrict}</span>
                  <span>·</span>
                  <span>Mã #{rental.code}</span>
                  {rental.ownerVerified ? (
                    <Badge variant="outline" className="text-primary">
                      <CheckCircleIcon data-icon="inline-start" weight="fill" />
                      Đã xác minh
                    </Badge>
                  ) : null}
                </div>
                <h1 className="font-heading text-3xl font-semibold md:text-5xl">
                  {rental.name}
                </h1>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                <CopyableAddress address={fullAddress} />
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {rental.googleMapsUrl ? (
                    <Button asChild variant="outline" className="w-fit">
                      <a
                        href={rental.googleMapsUrl}
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
                    roomCode={rental.code}
                    variant="outline"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <DetailFact
              icon={HouseLineIcon}
              title={`${rental.areaM2} m²`}
              text="Diện tích sử dụng"
            />
            <DetailFact
              icon={UsersThreeIcon}
              title={`Tối đa ${rental.maxOccupants} người`}
              text="Số người ở"
            />
            <DetailFact
              icon={HouseLineIcon}
              title={getRentalTypeLabel(
                rental.rentalType,
                rental.otherRentalType
              )}
              text="Loại hình thuê"
            />
            <DetailFact
              icon={CheckCircleIcon}
              title={rentalAvailabilityStatusLabels[rental.availabilityStatus]}
              text="Tình trạng phòng"
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
                <p className="text-sm leading-7 whitespace-pre-line text-muted-foreground">
                  {rental.description}
                </p>
                {amenities.length ? (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary">
                        {getRentalAmenityLabel(amenity)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-primary" />
                  Chi phí và quy định
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  <DetailBadge label="Điện" text={rental.electricityPrice} />
                  <DetailBadge label="Nước" text={rental.waterPrice} />
                  {rental.otherCosts ? (
                    <DetailBadge
                      label="Chi phí khác"
                      text={rental.otherCosts}
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  {rental.allowedRules.map((rule) => (
                    <RuleItem key={rule} allowed text={rule} />
                  ))}
                  {rental.disallowedRules.map((rule) => (
                    <RuleItem key={rule} text={rule} />
                  ))}
                  {!rental.allowedRules.length &&
                  !rental.disallowedRules.length ? (
                    <p className="text-muted-foreground">
                      Trao đổi thêm với Roovea khi xem phòng.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vị trí phòng</CardTitle>
              <CardDescription>
                {rental.legacyWard}, {rental.legacyDistrict} · Hiện nay:{" "}
                {rental.newWard}, {rental.city}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="aspect-[16/7] min-h-72 overflow-hidden bg-muted">
                <iframe
                  title={`Bản đồ ${rental.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(
                    rental.addressDetail
                  )}&output=embed`}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {rental.googleMapsUrl ? (
                  <Button asChild variant="outline" className="w-fit">
                    <a
                      href={rental.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MapPinIcon data-icon="inline-start" />
                      Xem trên Google Maps
                    </a>
                  </Button>
                ) : null}
                {rental.nearbyPlaces.map((place) => (
                  <Badge key={place} variant="outline">
                    Gần {place}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {videos.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Video phòng</CardTitle>
                <CardDescription>
                  Xem không gian thực tế của phòng trước khi liên hệ.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {videos.map((videoUrl) => {
                  const embedUrl = getVideoEmbedUrl(videoUrl)

                  return (
                    <div
                      key={videoUrl}
                      className="aspect-video overflow-hidden bg-muted"
                    >
                      {embedUrl ? (
                        <iframe
                          src={embedUrl}
                          title={`Video ${rental.name}`}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Button asChild variant="secondary">
                            <a
                              href={videoUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
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

          {similarRentals.length ? (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <Badge variant="secondary">Có thể bạn quan tâm</Badge>
                  <h2 className="mt-2 font-heading text-2xl font-semibold">
                    Phòng trọ tương tự
                  </h2>
                </div>
                <Button asChild variant="outline">
                  <Link href="/timphongtro">Xem tất cả</Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {similarRentals.map((item) => (
                  <RentalSuggestionCard key={item.code} rental={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function DetailBadge({ label, text }: { label: string; text: string }) {
  return (
    <Badge variant="secondary" className="h-7 gap-1.5 px-2.5">
      <InfoIcon data-icon="inline-start" />
      {label}
      <span className="font-normal text-muted-foreground">{text}</span>
    </Badge>
  )
}

function RuleItem({
  allowed = false,
  text,
}: {
  allowed?: boolean
  text: string
}) {
  const Icon = allowed ? CheckCircleIcon : XCircleIcon

  return (
    <p className="flex items-start gap-2">
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${
          allowed ? "text-primary" : "text-muted-foreground"
        }`}
      />
      {text}
    </p>
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
      <span className="leading-4">{label}</span>
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
      <strong className="text-sm leading-5">{title}</strong>
      <span className="truncate text-xs text-muted-foreground">{text}</span>
    </div>
  )
}

function RentalSuggestionCard({ rental }: { rental: PublicRentalListing }) {
  const thumbnail =
    rental.media.images.find((image) => image.isThumbnail) ??
    rental.media.images[0]

  return (
    <Card size="sm" className="pt-0">
      <Link
        href={`/phongtro/${rental.code.toLowerCase()}`}
        className="relative block aspect-[4/3] overflow-hidden bg-muted"
      >
        {thumbnail ? (
          <Image
            src={thumbnail.url}
            alt={thumbnail.caption || rental.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.03]"
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            Chưa có ảnh
          </div>
        )}
      </Link>
      <CardHeader>
        <CardTitle className="line-clamp-2">
          <Link href={`/phongtro/${rental.code.toLowerCase()}`}>
            {rental.name}
          </Link>
        </CardTitle>
        <CardDescription>
          {rental.legacyWard}, {rental.legacyDistrict}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{rental.areaM2} m²</span>
        <span>Tối đa {rental.maxOccupants} người</span>
        <strong className="text-foreground">
          {formatCurrency(rental.monthlyPrice)}/tháng
        </strong>
      </CardContent>
    </Card>
  )
}
