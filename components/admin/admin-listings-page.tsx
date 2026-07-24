"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArchiveIcon,
  CheckCircleIcon,
  DotsThreeIcon,
  EyeIcon,
  EyeSlashIcon,
  NotePencilIcon,
  PlusIcon,
} from "@phosphor-icons/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { accommodationTypeLabels } from "@/lib/admin/options"
import type {
  AdminUnifiedListing,
  UnifiedListing,
} from "@/lib/listings/types"
import {
  rentalAvailabilityStatusLabels,
  rentalPublicationStatusLabels,
} from "@/lib/rentals/options"

type PublicationStatus = UnifiedListing["publicationStatus"]

const stayTypeLabels = {
  long_stay: "Phòng trọ · Dài hạn",
  short_stay: "Homestay · Ngắn hạn",
} as const

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

function primaryTypeLabel(listing: AdminUnifiedListing) {
  const type = listing.accommodationTypes[0]
  if (type === "other") return listing.otherAccommodationType || "Khác"
  return (
    accommodationTypeLabels[
      type as keyof typeof accommodationTypeLabels
    ] ?? type
  )
}

function statusVariant(status: PublicationStatus) {
  if (status === "published") return "default" as const
  if (status === "hidden") return "destructive" as const
  if (status === "archived") return "outline" as const
  return "secondary" as const
}

function listingEditHref(listing: AdminUnifiedListing) {
  return listing.stayType === "long_stay"
    ? `/admin/phongtro/${listing.id}/chinhsua`
    : `/admin/rooms/${listing.id}/edit`
}

function listingPublicHref(listing: AdminUnifiedListing) {
  return listing.stayType === "long_stay"
    ? `/phongtro/${listing.code.toLowerCase()}`
    : `/phong/${listing.slug}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function AdminListingsPage({
  initialListings,
}: {
  initialListings: AdminUnifiedListing[]
}) {
  const [listings, setListings] = useState(initialListings)
  const [search, setSearch] = useState("")
  const [stayType, setStayType] = useState("all")
  const [publicationStatus, setPublicationStatus] = useState("all")
  const [source, setSource] = useState("all")
  const [busyId, setBusyId] = useState("")

  const filteredListings = useMemo(() => {
    const keyword = normalizeSearch(search.trim())

    return listings.filter((listing) => {
      if (stayType !== "all" && listing.stayType !== stayType) return false
      if (
        publicationStatus !== "all" &&
        listing.publicationStatus !== publicationStatus
      ) {
        return false
      }
      if (source !== "all" && listing.source !== source) return false
      if (!keyword) return true

      return normalizeSearch(
        [
          listing.code,
          listing.title,
          listing.ownerName,
          listing.ownerEmail,
          listing.supplierName,
          listing.address.legacyProvinceName,
          listing.address.legacyDistrictName,
          listing.address.legacyWardName,
        ].join(" ")
      ).includes(keyword)
    })
  }, [listings, publicationStatus, search, source, stayType])

  const publishedCount = listings.filter(
    (listing) => listing.publicationStatus === "published"
  ).length
  const selfServiceCount = listings.filter(
    (listing) => listing.source === "self_service"
  ).length
  const longStayCount = listings.filter(
    (listing) => listing.stayType === "long_stay"
  ).length
  const shortStayCount = listings.length - longStayCount

  async function setListingStatus(
    listing: AdminUnifiedListing,
    nextStatus: PublicationStatus
  ) {
    setBusyId(listing.id)

    try {
      const response = await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "set_publication_status",
          publicationStatus: nextStatus,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        listing?: UnifiedListing
        error?: string
      }

      if (!response.ok || !payload.listing) {
        throw new Error(payload.error ?? "Không thể cập nhật tin đăng.")
      }

      setListings((current) =>
        current.map((item) =>
          item.id === listing.id ? { ...item, ...payload.listing } : item
        )
      )
      toast.success(
        nextStatus === "published"
          ? "Tin đăng đã được công khai."
          : nextStatus === "hidden"
            ? "Tin đăng đã được ẩn."
            : nextStatus === "archived"
              ? "Tin đăng đã được lưu trữ."
              : "Tin đăng đã chuyển về bản nháp."
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật tin đăng."
      )
    } finally {
      setBusyId("")
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">
            Quản lý tin đăng
          </h1>
          <p className="text-xs/relaxed text-muted-foreground">
            Tất cả phòng trọ và homestay do user hoặc admin đăng đều xuất hiện
            tại đây. Tin hợp lệ do user đăng được tự động công khai.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/phongtro/moi">
            <PlusIcon data-icon="inline-start" />
            Tạo tin mới
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Tổng số tin</CardDescription>
            <CardTitle className="text-2xl">{listings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Đang công khai</CardDescription>
            <CardTitle className="text-2xl">{publishedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>User tự đăng</CardDescription>
            <CardTitle className="text-2xl">{selfServiceCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Trọ / Homestay</CardDescription>
            <CardTitle className="text-2xl">
              {longStayCount} / {shortStayCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tin</CardTitle>
          <CardDescription>
            Tìm theo mã tin, tiêu đề, người đăng hoặc địa chỉ.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">
              {filteredListings.length} kết quả
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_180px_180px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã tin, tiêu đề, user..."
              aria-label="Tìm tin đăng"
            />
            <Select value={stayType} onValueChange={setStayType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Loại tin" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả loại tin</SelectItem>
                  <SelectItem value="long_stay">Phòng trọ dài hạn</SelectItem>
                  <SelectItem value="short_stay">
                    Homestay ngắn hạn
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={publicationStatus}
              onValueChange={setPublicationStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="published">Đã công khai</SelectItem>
                  <SelectItem value="hidden">Đã ẩn</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Nguồn đăng" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Tất cả nguồn đăng</SelectItem>
                  <SelectItem value="self_service">User tự đăng</SelectItem>
                  <SelectItem value="admin">Admin đăng</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {filteredListings.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tin đăng</TableHead>
                  <TableHead>Loại hình</TableHead>
                  <TableHead>Người đăng</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Cập nhật</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="max-w-72 whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline">{listing.code}</Badge>
                          <Badge variant="secondary">
                            {listing.source === "self_service"
                              ? "User đăng"
                              : "Admin đăng"}
                          </Badge>
                        </div>
                        <span className="font-medium">{listing.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{stayTypeLabels[listing.stayType]}</span>
                        <span className="text-muted-foreground">
                          {primaryTypeLabel(listing)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 font-medium">
                          {listing.ownerName ||
                            listing.supplierName ||
                            "Roovea Admin"}
                          {listing.ownerVerified &&
                          listing.source === "self_service" ? (
                            <CheckCircleIcon
                              weight="fill"
                              className="text-primary"
                            />
                          ) : null}
                        </span>
                        {listing.ownerEmail ? (
                          <span className="text-muted-foreground">
                            {listing.ownerEmail}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <span>
                          {listing.address.legacyWardName ||
                            listing.address.newWardName}
                        </span>
                        <span className="text-muted-foreground">
                          {listing.address.legacyDistrictName},{" "}
                          {listing.address.legacyProvinceName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge
                          variant={statusVariant(listing.publicationStatus)}
                        >
                          {
                            rentalPublicationStatusLabels[
                              listing.publicationStatus
                            ]
                          }
                        </Badge>
                        <span className="text-muted-foreground">
                          {
                            rentalAvailabilityStatusLabels[
                              listing.availabilityStatus
                            ]
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(listing.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            disabled={busyId === listing.id}
                            aria-label={`Thao tác với tin ${listing.code}`}
                          >
                            <DotsThreeIcon weight="bold" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{listing.code}</DropdownMenuLabel>
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={listingEditHref(listing)}>
                                <NotePencilIcon />
                                Chỉnh sửa
                              </Link>
                            </DropdownMenuItem>
                            {listing.publicationStatus === "published" ? (
                              <DropdownMenuItem asChild>
                                <Link href={listingPublicHref(listing)}>
                                  <EyeIcon />
                                  Xem trang công khai
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {listing.publicationStatus !== "published" ? (
                              <DropdownMenuItem
                                onSelect={() =>
                                  void setListingStatus(listing, "published")
                                }
                              >
                                <EyeIcon />
                                Công khai tin
                              </DropdownMenuItem>
                            ) : null}
                            {listing.publicationStatus !== "hidden" ? (
                              <DropdownMenuItem
                                onSelect={() =>
                                  void setListingStatus(listing, "hidden")
                                }
                              >
                                <EyeSlashIcon />
                                Ẩn tin
                              </DropdownMenuItem>
                            ) : null}
                            {listing.publicationStatus !== "archived" ? (
                              <DropdownMenuItem
                                onSelect={() =>
                                  void setListingStatus(listing, "archived")
                                }
                              >
                                <ArchiveIcon />
                                Lưu trữ
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-72 border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <EyeSlashIcon />
                </EmptyMedia>
                <EmptyTitle>Không có tin phù hợp</EmptyTitle>
                <EmptyDescription>
                  Thử thay đổi từ khóa hoặc bộ lọc để xem các tin khác.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("")
                    setStayType("all")
                    setPublicationStatus("all")
                    setSource("all")
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
