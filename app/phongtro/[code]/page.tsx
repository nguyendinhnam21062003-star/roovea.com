import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CheckCircleIcon,
  CurrencyCircleDollarIcon,
  HouseLineIcon,
  MapPinIcon,
  UsersThreeIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr"

import { ContactActions } from "@/components/contact-actions"
import { CopyableAddress } from "@/components/copyable-address"
import { RoomGallery } from "@/components/room-gallery"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  getRentalAmenityLabel,
  getRentalTypeLabel,
  rentalAvailabilityStatusLabels,
} from "@/lib/rentals/options"
import { getPublicRentalByCode } from "@/lib/services/rentals"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> {
  const { code } = await params
  const rental = await getPublicRentalByCode(code)

  return rental
    ? {
        title: `${rental.name} | Roovea`,
        description: rental.description.slice(0, 155),
      }
    : { title: "Không tìm thấy phòng | Roovea" }
}

export default async function RentalDetailPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
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
  const address = rental.addressDetail

  return (
    <main className="min-h-svh bg-background">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/">Trang chủ</Link>
          <span>/</span>
          <Link href="/timphongtro">Tìm phòng trọ</Link>
          <span>/</span>
          <span>{rental.code}</span>
        </nav>

        <RoomGallery
          media={media}
          roomCode={rental.code}
          roomName={rental.name}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {getRentalTypeLabel(
                    rental.rentalType,
                    rental.otherRentalType
                  )}
                </Badge>
                <Badge variant={available ? "default" : "secondary"}>
                  {rentalAvailabilityStatusLabels[rental.availabilityStatus]}
                </Badge>
                {rental.ownerVerified ? (
                  <Badge variant="outline" className="text-blue-600">
                    <CheckCircleIcon data-icon="inline-start" weight="fill" />
                    Chủ nhà đã xác minh
                  </Badge>
                ) : null}
              </div>
              <h1 className="font-heading text-3xl font-semibold md:text-4xl">
                {rental.name}
              </h1>
              <p className="text-muted-foreground">
                {rental.legacyWard}, {rental.legacyDistrict} · Hiện nay:{" "}
                {rental.newWard}, TP.HCM
              </p>
            </div>

            {!available ? (
              <Alert>
                <AlertTitle>Phòng hiện đã hết</AlertTitle>
                <AlertDescription>
                  Roovea giữ lại trang để bạn tham khảo thông tin. Hãy xem các
                  phòng còn trống trong cùng khu vực.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact icon={HouseLineIcon} label={`${rental.areaM2} m²`} />
              <Fact
                icon={UsersThreeIcon}
                label={`Tối đa ${rental.maxOccupants} người`}
              />
              <Fact
                icon={CurrencyCircleDollarIcon}
                label={`${formatCurrency(rental.monthlyPrice)}/tháng`}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mô tả phòng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {rental.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Địa chỉ</CardTitle>
                <CardDescription>
                  Hiển thị đầy đủ địa chỉ và cả hai cách gọi hành chính.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <CopyableAddress address={address} />
                <p className="text-sm text-muted-foreground">
                  Theo địa giới cũ: {rental.legacyWard},{" "}
                  {rental.legacyDistrict}
                </p>
                <p className="text-sm text-muted-foreground">
                  Theo địa giới mới: {rental.newWard}, {rental.city}
                </p>
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
                {rental.nearbyPlaces.length ? (
                  <div className="flex flex-wrap gap-2">
                    {rental.nearbyPlaces.map((place) => (
                      <Badge key={place} variant="outline">
                        Gần {place}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tiện ích</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {[...rental.amenities, ...rental.customAmenities].map(
                  (amenity) => (
                    <p key={amenity} className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="shrink-0 text-primary" />
                      {getRentalAmenityLabel(amenity)}
                    </p>
                  )
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Được phép</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {rental.allowedRules.length ? (
                    rental.allowedRules.map((rule) => (
                      <p key={rule} className="flex items-start gap-2 text-sm">
                        <CheckCircleIcon className="mt-0.5 shrink-0 text-primary" />
                        {rule}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Trao đổi thêm với Roovea.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Không được phép</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {rental.disallowedRules.length ? (
                    rental.disallowedRules.map((rule) => (
                      <p key={rule} className="flex items-start gap-2 text-sm">
                        <XCircleIcon className="mt-0.5 shrink-0 text-muted-foreground" />
                        {rule}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Chưa có quy định riêng.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {formatCurrency(rental.monthlyPrice)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /tháng
                  </span>
                </CardTitle>
                <CardDescription>
                  Roovea tiếp nhận nhu cầu và kết nối với chủ nhà.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 text-sm">
                  <p>Điện: {rental.electricityPrice}</p>
                  <p>Nước: {rental.waterPrice}</p>
                  {rental.otherCosts ? <p>Khác: {rental.otherCosts}</p> : null}
                </div>
                <Separator />
                {available ? (
                  <ContactActions
                    roomCode={rental.code}
                    label="Liên hệ Roovea"
                    className="w-full"
                    triggerClassName="w-full"
                  />
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/timphongtro">Xem phòng đang còn</Link>
                  </Button>
                )}
                <p className="text-xs leading-5 text-muted-foreground">
                  Thông tin liên hệ riêng của chủ nhà không được công khai trên
                  trang.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  )
}

function Fact({
  icon: Icon,
  label,
}: {
  icon: typeof HouseLineIcon
  label: string
}) {
  return (
    <div className="flex items-center gap-2 border bg-muted/30 p-3 text-sm">
      <Icon className="shrink-0 text-primary" />
      <span>{label}</span>
    </div>
  )
}
