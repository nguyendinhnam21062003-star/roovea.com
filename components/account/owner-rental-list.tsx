"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  ArchiveIcon,
  EyeIcon,
  ImageSquareIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { accommodationTypeLabels } from "@/lib/admin/options"
import type {
  ListingStayType,
  UnifiedListing,
} from "@/lib/listings/types"
import {
  rentalAvailabilityStatusLabels,
  rentalPublicationStatusLabels,
} from "@/lib/rentals/options"

const allFilterValue = "all"

function getListingTypeLabel(listing: UnifiedListing) {
  const primary = listing.accommodationTypes[0]
  if (primary === "other") return listing.otherAccommodationType || "Khác"
  return (
    accommodationTypeLabels[
      primary as keyof typeof accommodationTypeLabels
    ] ?? primary
  )
}

function getListingLocation(listing: UnifiedListing) {
  const locality =
    listing.address.newWardName || listing.address.legacyWardName
  const region =
    listing.address.newProvinceName ||
    listing.address.legacyDistrictName ||
    listing.address.legacyProvinceName

  return [locality, region].filter(Boolean).join(", ") || "Chưa cập nhật địa chỉ"
}

function getListingThumbnail(listing: UnifiedListing) {
  return (
    listing.media.images.find((image) => image.isThumbnail) ??
    listing.media.images[0]
  )
}

function matchesSearch(listing: UnifiedListing, query: string) {
  if (!query) return true

  const searchableText = [
    listing.title,
    listing.code,
    getListingTypeLabel(listing),
    listing.address.addressDetail,
    listing.address.newWardName,
    listing.address.newProvinceName,
    listing.address.legacyWardName,
    listing.address.legacyDistrictName,
    listing.address.legacyProvinceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("vi")

  return searchableText.includes(query.toLocaleLowerCase("vi"))
}

export function OwnerRentalList({
  listings,
}: {
  listings: UnifiedListing[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ListingStayType>("long_stay")
  const [query, setQuery] = useState("")
  const [publicationStatus, setPublicationStatus] = useState(allFilterValue)
  const [availabilityStatus, setAvailabilityStatus] = useState(allFilterValue)
  const [archivingId, setArchivingId] = useState("")

  const listingCounts = useMemo(
    () => ({
      long_stay: listings.filter((listing) => listing.stayType === "long_stay")
        .length,
      short_stay: listings.filter(
        (listing) => listing.stayType === "short_stay"
      ).length,
    }),
    [listings]
  )

  const filteredListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.stayType === activeTab &&
          (publicationStatus === allFilterValue ||
            listing.publicationStatus === publicationStatus) &&
          (availabilityStatus === allFilterValue ||
            listing.availabilityStatus === availabilityStatus) &&
          matchesSearch(listing, query.trim())
      ),
    [
      activeTab,
      availabilityStatus,
      listings,
      publicationStatus,
      query,
    ]
  )

  const hasActiveFilters =
    Boolean(query.trim()) ||
    publicationStatus !== allFilterValue ||
    availabilityStatus !== allFilterValue

  function clearFilters() {
    setQuery("")
    setPublicationStatus(allFilterValue)
    setAvailabilityStatus(allFilterValue)
  }

  async function archiveRental(id: string) {
    setArchivingId(id)
    try {
      const response = await fetch(`/api/taikhoan/tindang/${id}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể lưu trữ tin.")
      }

      toast.success("Đã lưu trữ tin đăng.")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể lưu trữ tin."
      )
    } finally {
      setArchivingId("")
    }
  }

  function renderListings() {
    if (!filteredListings.length) {
      return (
        <Empty className="border bg-background">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              {hasActiveFilters ? <MagnifyingGlassIcon /> : <PlusIcon />}
            </EmptyMedia>
            <EmptyTitle>
              {hasActiveFilters
                ? "Không tìm thấy tin phù hợp"
                : activeTab === "long_stay"
                  ? "Chưa có tin phòng trọ"
                  : "Chưa có tin homestay"}
            </EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "Thử thay đổi từ khóa hoặc điều kiện lọc để xem thêm kết quả."
                : "Tạo tin đầu tiên để bắt đầu quản lý chỗ ở của bạn."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            ) : (
              <Button asChild>
                <Link href="/taikhoan/tindang/moi">Đăng tin mới</Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredListings.map((listing) => {
          const thumbnail = getListingThumbnail(listing)

          return (
            <Card key={listing.id} className="h-full overflow-hidden pt-0">
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {thumbnail ? (
                  <Image
                    src={thumbnail.url}
                    alt={
                      thumbnail.caption ||
                      listing.title ||
                      `Ảnh tin ${listing.code}`
                    }
                    fill
                    unoptimized
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageSquareIcon className="size-8" aria-hidden />
                    <span className="sr-only">Tin chưa có ảnh</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{listing.code}</Badge>
                  <Badge
                    variant={
                      listing.publicationStatus === "published"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {rentalPublicationStatusLabels[listing.publicationStatus]}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2">
                  {listing.title || "Tin chưa đặt tên"}
                </CardTitle>
                <CardDescription>
                  {getListingTypeLabel(listing)} ·{" "}
                  {rentalAvailabilityStatusLabels[listing.availabilityStatus]}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                <p className="line-clamp-2">{getListingLocation(listing)}</p>
                {listing.hiddenReason ? (
                  <p className="line-clamp-2">
                    Lý do ẩn: {listing.hiddenReason}
                  </p>
                ) : null}
              </CardContent>
              <CardFooter className="flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/taikhoan/tindang/${listing.id}/chinhsua`}>
                    <PencilSimpleIcon data-icon="inline-start" />
                    Chỉnh sửa
                  </Link>
                </Button>
                {listing.publicationStatus === "published" ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      href={
                        listing.stayType === "short_stay"
                          ? `/phong/${listing.slug}`
                          : `/phongtro/${listing.code.toLowerCase()}`
                      }
                    >
                      <EyeIcon data-icon="inline-start" />
                      Xem tin
                    </Link>
                  </Button>
                ) : null}
                {listing.publicationStatus !== "archived" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={archivingId === listing.id}
                      >
                        <ArchiveIcon data-icon="inline-start" />
                        Lưu trữ
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Lưu trữ tin đăng?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tin sẽ không còn xuất hiện công khai nhưng dữ liệu vẫn
                          được giữ lại trong tài khoản.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => void archiveRental(listing.id)}
                        >
                          Lưu trữ
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ListingStayType)}
      className="gap-4"
    >
      <div className="flex flex-col gap-3 border bg-background p-3 lg:flex-row lg:items-center lg:justify-between">
        <TabsList className="w-full sm:w-fit" aria-label="Loại tin đăng">
          <TabsTrigger value="long_stay">
            Phòng trọ
            <Badge variant="secondary">{listingCounts.long_stay}</Badge>
          </TabsTrigger>
          <TabsTrigger value="short_stay">
            Homestay
            <Badge variant="secondary">{listingCounts.short_stay}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-1 lg:justify-end">
          <InputGroup className="sm:col-span-2 lg:max-w-sm">
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mã tin hoặc địa chỉ"
              aria-label="Tìm kiếm tin đăng"
            />
            <InputGroupAddon>
              <MagnifyingGlassIcon aria-hidden />
            </InputGroupAddon>
          </InputGroup>

          <Select
            value={publicationStatus}
            onValueChange={setPublicationStatus}
          >
            <SelectTrigger className="w-full sm:min-w-40">
              <SelectValue placeholder="Trạng thái tin" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={allFilterValue}>Tất cả trạng thái</SelectItem>
                {Object.entries(rentalPublicationStatusLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={availabilityStatus}
            onValueChange={setAvailabilityStatus}
          >
            <SelectTrigger className="w-full sm:min-w-36">
              <SelectValue placeholder="Tình trạng phòng" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={allFilterValue}>
                  Tất cả tình trạng
                </SelectItem>
                {Object.entries(rentalAvailabilityStatusLabels).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TabsContent value="long_stay">{renderListings()}</TabsContent>
      <TabsContent value="short_stay">{renderListings()}</TabsContent>
    </Tabs>
  )
}
